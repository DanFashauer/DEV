import Foundation
import UIKit

/// Manages the session lifecycle state machine
final class SessionStateManager: ObservableObject, BadgeReaderManagerDelegate {
    
    // MARK: - Singleton
    
    static let shared = SessionStateManager()
    
    // MARK: - Published Properties
    
    @Published private(set) var currentState: SessionState = .lockedIdle
    @Published private(set) var currentSession: SessionData?
    @Published private(set) var capturedBadgeId: String?
    @Published private(set) var lastError: Error?
    
    // MARK: - Properties
    
    var currentSessionId: String? {
        currentSession?.sessionId
    }
    
    var isSessionActive: Bool {
        currentState == .activeSession && currentSession?.isActive == true
    }
    
    private var stateTransitionQueue = DispatchQueue(label: "com.enterprise.shell.stateQueue")
    private var activityTimer: Timer?
    private var timeoutTimer: Timer?
    private let timeoutGracePeriod: TimeInterval = 5.0
    
    // MARK: - Initialization
    
    private init() {
        // Load any persisted session state
        loadPersistedState()
    }
    
    // MARK: - State Transitions
    
    /// Transition to a new state with validation
    func transition(to newState: SessionState, error: Error? = nil) {
        stateTransitionQueue.async { [weak self] in
            guard let self = self else { return }
            
            // Validate transition
            guard self.currentState.allowedTransitions.contains(newState) else {
                let invalidTransitionError = SessionError.invalidStateTransition(
                    from: self.currentState,
                    to: newState
                )
                self.handleError(invalidTransitionError)
                return
            }
            
            let previousState = self.currentState
            
            // Execute state-specific entry/exit actions
            self.exitState(previousState)
            self.currentState = newState
            self.enterState(newState)
            
            // Notify observers
            DispatchQueue.main.async {
                self.lastError = error
                NotificationCenter.default.post(
                    name: .sessionStateDidChange,
                    object: nil,
                    userInfo: [
                        SessionStateNotificationKeys.newState: newState,
                        SessionStateNotificationKeys.previousState: previousState,
                        SessionStateNotificationKeys.error: error as Any
                    ]
                )
            }
            
            // Log state transition
            AuditLogger.shared.log(event: .stateTransition, metadata: [
                "previousState": previousState.rawValue,
                "newState": newState.rawValue
            ])
        }
    }
    
    // MARK: - State Actions
    
    private func exitState(_ state: SessionState) {
        switch state {
        case .activeSession:
            stopActivityTimer()
            stopTimeoutTimer()
        default:
            break
        }
    }
    
    private func enterState(_ state: SessionState) {
        switch state {
        case .lockedIdle:
            cleanupCurrentSession()
            capturedBadgeId = nil
            
        case .badgeCaptured:
            // Badge ID is already set before transition
            break
            
        case .authenticating:
            // Begin OIDC authentication flow
            Task {
                await beginAuthentication()
            }
            
        case .provisioning:
            // Configure session based on persona
            Task {
                await provisionSession()
            }
            
        case .activeSession:
            startActivityTimer()
            startTimeoutTimer()
            
        case .terminating:
            // Begin session teardown
            Task {
                await terminateSession(reason: .userInitiated)
            }
        }
    }
    
    // MARK: - Badge Handling
    
    /// Called when a badge is scanned
    func onBadgeScanned(_ badgeId: String) {
        guard currentState == .lockedIdle else {
            AuditLogger.shared.log(event: .badgeScannedUnexpectedState, metadata: [
                "badgeId": maskBadgeId(badgeId),
                "currentState": currentState.rawValue
            ])
            return
        }
        
        capturedBadgeId = badgeId
        
        AuditLogger.shared.log(event: .badgeScanned, metadata: [
            "badgeId": maskBadgeId(badgeId)
        ])
        
        // Transition to badge captured state
        transition(to: .badgeCaptured)
    }
    
    // MARK: - Authentication Flow
    
    private func beginAuthentication() async {
        guard let badgeId = capturedBadgeId else {
            transition(to: .lockedIdle, error: SessionError.missingBadgeId)
            return
        }
        
        // Notify UI to show authenticating state
        transition(to: .authenticating)
        
        do {
            // Step 1: Validate badge with backend and get session token
            let startSessionResponse = try await BackendService.shared.startSession(
                badgeId: badgeId,
                deviceId: DeviceInfo.identifier,
                deviceSerial: DeviceInfo.serialNumber ?? "unknown"
            )
            
            guard startSessionResponse.success,
                  let sessionToken = startSessionResponse.sessionToken,
                  let persona = startSessionResponse.persona,
                  let user = startSessionResponse.user else {
                
                let errorMessage = startSessionResponse.error?.message ?? "Unknown error"
                throw SessionError.authenticationFailed(errorMessage)
            }
            
            // Step 2: Initiate OIDC authentication
            let oidcResult = try await OIDCAuthService.shared.authenticate(
                sessionToken: sessionToken,
                persona: persona
            )
            
            // Create session data
            var session = SessionData(
                sessionId: UUID().uuidString,
                userId: user.userId,
                badgeId: badgeId,
                persona: persona,
                accessToken: oidcResult.accessToken,
                refreshToken: oidcResult.refreshToken,
                idToken: oidcResult.idToken,
                expiresAt: oidcResult.expiresAt
            )
            
            currentSession = session
            
            // Transition to provisioning
            transition(to: .provisioning)
            
        } catch {
            AuditLogger.shared.log(event: .authenticationFailed, metadata: [
                "error": error.localizedDescription
            ])
            transition(to: .lockedIdle, error: error)
        }
    }
    
    // MARK: - Session Provisioning
    
    private func provisionSession() async {
        guard var session = currentSession else {
            transition(to: .lockedIdle, error: SessionError.missingSession)
            return
        }
        
        do {
            // Apply persona-based configuration
            applyPersonaConfiguration(session.persona)
            
            // Launch required apps
            await launchRequiredApps(for: session.persona)
            
            // Save session to secure storage
            try KeychainService.shared.saveSession(session)
            
            // Transition to active session
            transition(to: .activeSession)
            
            AuditLogger.shared.log(event: .sessionStarted, metadata: [
                "sessionId": session.sessionId,
                "userId": session.userId,
                "persona": session.persona.roleName
            ])
            
        } catch {
            AuditLogger.shared.log(event: .sessionProvisioningFailed, metadata: [
                "error": error.localizedDescription
            ])
            transition(to: .lockedIdle, error: error)
        }
    }
    
    // MARK: - Persona Configuration
    
    private func applyPersonaConfiguration(_ persona: Persona) {
        // Apply restrictions
        applyRestrictions(persona.restrictions)
        
        // Apply theme
        applyTheme(persona.workspaceConfig.theme)
    }
    
    private func applyRestrictions(_ restrictions: SessionRestrictions) {
        // Configure Keychain access groups
        // Configure pasteboard restrictions
        // Configure screen capture settings
        
        // Store for reference during session
        UserDefaults.standard.set(restrictions.idleTimeout, forKey: "idle_timeout")
        UserDefaults.standard.set(restrictions.allowCopyPaste, forKey: "allow_copy_paste")
    }
    
    private func applyTheme(_ theme: ThemeConfig) {
        // Apply theme colors and configuration
        // This would update UI appearance
    }
    
    // MARK: - App Launching
    
    private func launchRequiredApps(for persona: Persona) async {
        let launcher = AppLauncher.shared
        
        for app in persona.appLaunchConfig.requiredApps {
            do {
                try await launcher.launchEnterpriseApp(app)
            } catch {
                AuditLogger.shared.log(event: .appLaunchFailed, metadata: [
                    "appId": app.appId,
                    "error": error.localizedDescription
                ])
                // Continue launching other apps
            }
        }
    }
    
    // MARK: - Session Termination
    
    private var isTerminating = false
    
    func endSession(userInitiated: Bool = false) {
        // Prevent concurrent termination attempts
        guard !isTerminating else { return }
        guard currentState == .activeSession else { return }
        
        isTerminating = true
        let reason: SessionEndReason = userInitiated ? .userInitiated : .timeout
        Task {
            await terminateSession(reason: reason)
            isTerminating = false
        }
    }
    
    private func terminateSession(reason: SessionEndReason) async {
        guard currentState != .terminating else { return }
        
        transition(to: .terminating)
        
        guard let session = currentSession else {
            transition(to: .lockedIdle)
            return
        }
        
        do {
            // Step 1: Revoke OIDC tokens
            if let accessToken = session.accessToken {
                try await OIDCAuthService.shared.revokeToken(accessToken)
            }
            
            // Step 2: Send audit logs to backend
            try await sendSessionAudit(session: session, reason: reason)
            
            // Step 3: Notify backend of session end
            try await BackendService.shared.endSession(
                sessionId: session.sessionId,
                reason: reason
            )
            
            // Step 4: Clear all local data
            clearLocalSessionData()
            
            // Transition to locked idle
            transition(to: .lockedIdle)
            
            AuditLogger.shared.log(event: .sessionEnded, metadata: [
                "sessionId": session.sessionId,
                "reason": reason.rawValue,
                "duration": session.startedAt.timeIntervalSinceNow
            ])
            
        } catch {
            AuditLogger.shared.log(event: .sessionTerminationError, metadata: [
                "error": error.localizedDescription
            ])
            // Still clear local data and return to locked state
            clearLocalSessionData()
            transition(to: .lockedIdle)
        }
    }
    
    // MARK: - Data Cleanup
    
    private func cleanupCurrentSession() {
        // Always clear session data when transitioning to lockedIdle
        // The guard was removed because by the time this is called,
        // currentState has already been changed to .lockedIdle
        clearLocalSessionData()
    }
    
    private func clearLocalSessionData() {
        // Clear Keychain items
        KeychainService.shared.clearAllSessionData()
        
        // Clear UserDefaults session data
        UserDefaults.standard.removeObject(forKey: "current_session_id")
        UserDefaults.standard.removeObject(forKey: "idle_timeout")
        UserDefaults.standard.removeObject(forKey: "allow_copy_paste")
        
        // Clear any cached data
        URLCache.shared.removeAllCachedResponses()
        
        // Reset session data
        currentSession = nil
        capturedBadgeId = nil
        lastError = nil
    }
    
    private func sendSessionAudit(session: SessionData, reason: SessionEndReason) async throws {
        let duration = Date().timeIntervalSince(session.startedAt)
        let auditData = AuditData(
            sessionDuration: duration,
            actionsPerformed: [],
            resourcesAccessed: [],
            anyErrors: lastError != nil
        )
        
        try await BackendService.shared.sendAuditData(
            sessionId: session.sessionId,
            auditData: auditData
        )
    }
    
    // MARK: - Timeout Management
    
    private func startActivityTimer() {
        stopActivityTimer()
        
        activityTimer = Timer.scheduledTimer(withTimeInterval: 60.0, repeats: true) { [weak self] _ in
            self?.updateActivity()
        }
    }
    
    private func stopActivityTimer() {
        activityTimer?.invalidate()
        activityTimer = nil
    }
    
    private func updateActivity() {
        currentSession?.updateActivity()
        // Reset the timeout timer when user is active
        startTimeoutTimer()
    }
    
    private func startTimeoutTimer() {
        stopTimeoutTimer()
        
        let timeout = UserDefaults.standard.object(forKey: "idle_timeout") as? TimeInterval ?? 300.0
        
        timeoutTimer = Timer.scheduledTimer(withTimeInterval: timeout, repeats: false) { [weak self] _ in
            self?.handleSessionTimeout()
        }
    }
    
    private func stopTimeoutTimer() {
        timeoutTimer?.invalidate()
        timeoutTimer = nil
    }
    
    private func handleSessionTimeout() {
        AuditLogger.shared.log(event: .sessionTimeout, metadata: nil)
        endSession(userInitiated: false)
    }
    
    // MARK: - Session Validation
    
    func checkSessionTimeout() async {
        guard isSessionActive else { return }
        
        if let expiresAt = currentSession?.expiresAt,
           Date() >= expiresAt {
            AuditLogger.shared.log(event: .sessionTokenExpired, metadata: nil)
            endSession(userInitiated: false)
        }
    }
    
    func validateActiveSession() async {
        guard isSessionActive else { return }
        
        // Check if token needs refresh
        if let expiresAt = currentSession?.expiresAt,
           expiresAt.timeIntervalSinceNow < 300 {
            // Token expires in less than 5 minutes, refresh it
            do {
                try await OIDCAuthService.shared.refreshToken()
            } catch {
                AuditLogger.shared.log(event: .tokenRefreshFailed, metadata: [
                    "error": error.localizedDescription
                ])
                endSession(userInitiated: false)
            }
        }
    }
    
    // MARK: - View Controller Factory
    
    func currentViewController() -> UIViewController {
        viewController(for: currentState)
    }
    
    func viewController(for state: SessionState) -> UIViewController {
        switch state {
        case .lockedIdle:
            return LockedIdleViewController()
        case .badgeCaptured:
            return BadgeCapturedViewController(badgeId: capturedBadgeId ?? "")
        case .authenticating:
            return AuthenticatingViewController()
        case .provisioning:
            return ProvisioningViewController()
        case .activeSession:
            return ActiveSessionViewController()
        case .terminating:
            return TerminatingViewController()
        }
    }
    
    // MARK: - Persistence
    
    private func loadPersistedState() {
        // Check for any persisted session state on launch
        // For security, we start in lockedIdle state
        currentState = .lockedIdle
    }
    
    // MARK: - Helpers
    
    /// Handle badge tap from hardware reader - clears session if active and starts new auth
    func handleBadgeTap(_ badgeId: String) {
        // If there's an active session, clear it first
        if currentState == .activeSession {
            AuditLogger.shared.log(event: .badgeTapDuringActiveSession, metadata: [
                "previousSessionId": currentSessionId ?? "none",
                "newBadgeId": maskBadgeId(badgeId)
            ])
            
            // Immediately clear all session data and transition to locked idle
            // This ensures clean state for new badge authentication
            clearLocalSessionData()
            
            // Stop any running timers
            stopActivityTimer()
            stopTimeoutTimer()
            
            // Transition to locked idle state (ready for new badge authentication)
            transition(to: .lockedIdle)
            
            // Start authentication process with new badge
            capturedBadgeId = badgeId
            transition(to: .authenticating)
        } else {
            // No active session - start new authentication
            capturedBadgeId = badgeId
            transition(to: .authenticating)
        }
    }
    
    private func maskBadgeId(_ badgeId: String) -> String {
        guard badgeId.count > 4 else { return "****" }
        let prefix = String(badgeId.prefix(2))
        let suffix = String(badgeId.suffix(2))
        return "\(prefix)****\(suffix)"
    }
    
    private func handleError(_ error: Error) {
        DispatchQueue.main.async {
            self.lastError = error
            AuditLogger.shared.log(event: .error, metadata: [
                "error": error.localizedDescription
            ])
        }
    }
    
    // MARK: - BadgeReaderManagerDelegate
    
    func badgeReader(_ manager: BadgeReaderManager, didReadBadge badgeId: String) {
        // Handle badge read event from hardware reader
        DispatchQueue.main.async { [weak self] in
            self?.handleBadgeTap(badgeId)
        }
    }
    
    func badgeReader(_ manager: BadgeReaderManager, didFailWithError error: Error) {
        AuditLogger.shared.log(event: .badgeReaderError, metadata: [
            "error": error.localizedDescription
        ])
    }
    
    func badgeReaderDidDisconnect(_ manager: BadgeReaderManager) {
        AuditLogger.shared.log(event: .badgeReaderDisconnected, metadata: nil)
    }
}

// MARK: - Session Errors

enum SessionError: LocalizedError {
    case invalidStateTransition(from: SessionState, to: SessionState)
    case missingBadgeId
    case authenticationFailed(String)
    case missingSession
    case tokenRefreshFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidStateTransition(let from, let to):
            return "Invalid state transition from \(from.rawValue) to \(to.rawValue)"
        case .missingBadgeId:
            return "Badge ID is missing"
        case .authenticationFailed(let message):
            return "Authentication failed: \(message)"
        case .missingSession:
            return "Session data is missing"
        case .tokenRefreshFailed:
            return "Failed to refresh authentication token"
        }
    }
}
