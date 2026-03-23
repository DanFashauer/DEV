import SwiftUI

// MARK: - Demo Data Models

enum DeviceState: String, CaseIterable {
    case idle
    case compliant
    case dueSoon = "due soon"
    case overdue
    case nonCompliant = "non-compliant"
    case idleWarning = "idle warning"
    case docked = "docked"
    case dockedReturned = "docked returned"
}

enum Vertical: String, CaseIterable {
    case healthcare
    case warehouse
    case retail
}

enum DecisionResult {
    case none
    case processing
    case allowed
    case denied
}

// Session status for demo
enum SessionStatus: String, CaseIterable {
    case active = "Active"
    case idleWarning = "Idle Warning"
    case idle = "Idle"
    case docked = "Docked"
    case returned = "Returned"
}

struct DemoConfig {
    var selectedVertical: Vertical = .healthcare
    var selectedState: DeviceState = .compliant
    var decisionResult: DecisionResult = .none
    
    // Session settings
    var sessionStatus: SessionStatus = .active
    var idleMinutes: Int = 0
    var isCharging: Bool = false
    var requirePasscode: Bool = false
    var requireBadge: Bool = true
    
    // Healthcare defaults
    static let healthcareUser = "Dr. Sarah Chen"
    static let healthcareRole = "Emergency Medicine"
    static let healthcareLocation = "Nurse Station A"
    static let healthcareReturn = "Nurse Station A Cart #3"
    
    // Warehouse defaults
    static let warehouseUser = "Marcus J."
    static let warehouseRole = "Forklift Operator"
    static let warehouseLocation = "Zone B"
    static let warehouseReturn = "Zone B Charging Dock"
    
    // Retail defaults
    static let retailUser = "Jamie K."
    static let retailRole = "Sales Associate"
    static let retailLocation = "Electronics"
    static let retailReturn = "Service Desk"
}

struct DeviceInfo {
    var name: String
    var location: String
    var returnLocation: String
    var user: String
    var role: String
    var shift: String
    var compliant: Bool
    var battery: Int
    var lastSync: String
    var dueTime: String
    
    static func forVertical(_ vertical: Vertical, state: DeviceState) -> DeviceInfo {
        switch vertical {
        case .healthcare:
            return DeviceInfo(
                name: "iPad - Nurse Station A",
                location: "St. Mary's Hospital",
                returnLocation: "Nurse Station A Cart #3",
                user: DemoConfig.healthcareUser,
                role: DemoConfig.healthcareRole,
                shift: "7:00 AM - 7:00 PM",
                compliant: state != .nonCompliant,
                battery: 78,
                lastSync: "2 min ago",
                dueTime: state == .overdue ? "30 min ago" : (state == .dueSoon ? "15 min" : "1h 15m")
            )
        case .warehouse:
            return DeviceInfo(
                name: "Handheld Scanner #042",
                location: "Zone B",
                returnLocation: "Zone B Charging Dock",
                user: DemoConfig.warehouseUser,
                role: DemoConfig.warehouseRole,
                shift: "Day Shift (6A - 6P)",
                compliant: state != .nonCompliant,
                battery: 78,
                lastSync: "5 min ago",
                dueTime: state == .overdue ? "1h ago" : (state == .dueSoon ? "30 min" : "2h 30m")
            )
        case .retail:
            return DeviceInfo(
                name: "Handheld - Floor",
                location: "Target Store #2847",
                returnLocation: "Service Desk",
                user: DemoConfig.retailUser,
                role: DemoConfig.retailRole,
                shift: "9:00 AM - 5:00 PM",
                compliant: state != .nonCompliant,
                battery: 65,
                lastSync: "3 min ago",
                dueTime: state == .overdue ? "Shift ended" : (state == .dueSoon ? "10 min" : "End of shift")
            )
        }
    }
}
