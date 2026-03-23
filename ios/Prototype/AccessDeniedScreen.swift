import SwiftUI

struct AccessDeniedScreen: View {
    @Binding var config: DemoConfig
    @Binding var currentScreen: ContentView.Screen
    
    var device: DeviceInfo {
        DeviceInfo.forVertical(config.selectedVertical, state: config.selectedState)
    }
    
    var denialReason: String {
        if config.selectedState == .nonCompliant {
            return "This device does not meet security requirements"
        } else if config.selectedState == .overdue {
            return "This device is overdue and has been disabled"
        }
        return "Access denied due to security policy"
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Denial Header
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(Color(hex: "ef4444").opacity(0.2))
                        .frame(width: 100, height: 100)
                    
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(Color(hex: "ef4444"))
                }
                
                Text("Access Denied")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)
            }
            .padding(.top, 60)
            .padding(.bottom, 40)
            
            // Reason Card
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(Color(hex: "ef4444"))
                    Text("Reason")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                }
                
                Text(denialReason)
                    .font(.system(size: 16))
                    .foregroundColor(.gray)
                    .fixedSize(horizontal: false, vertical: true)
                
                Divider()
                    .background(Color(hex: "333333"))
                
                Text("Automated Security Actions")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                
                VStack(spacing: 10) {
                    ActionRow(icon: "lock.shield.fill", label: "Device quarantined", isActive: true)
                    ActionRow(icon: "antenna.radiowaves.left.and.right", label: "SIEM alert sent", isActive: true)
                    ActionRow(icon: "ticket.fill", label: "ITSM ticket created", isActive: true)
                }
            }
            .padding(20)
            .background(Color(hex: "1f1f1f"))
            .cornerRadius(16)
            .padding(.horizontal, 24)
            
            Spacer()
            
            // Action Buttons
            VStack(spacing: 12) {
                Button(action: {
                    currentScreen = .ready
                }) {
                    HStack {
                        Image(systemName: "arrow.clockwise")
                        Text("Retry")
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color(hex: "0066CC"))
                    .cornerRadius(12)
                }
                
                HStack(spacing: 12) {
                    Button(action: {
                        // Contact support
                    }) {
                        HStack {
                            Image(systemName: "person.fill.questionmark")
                            Text("Contact Support")
                        }
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color(hex: "2a2a2a"))
                        .cornerRadius(10)
                    }
                    
                    Button(action: {
                        currentScreen = .glanceLayer
                    }) {
                        HStack {
                            Image(systemName: "eye.fill")
                            Text("Glance Layer")
                        }
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color(hex: "2a2a2a"))
                        .cornerRadius(10)
                    }
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .background(Color(hex: "1a1a1a"))
    }
}

struct ActionRow: View {
    let icon: String
    let label: String
    let isActive: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(isActive ? Color(hex: "22c55e") : Color(hex: "666666"))
            
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(isActive ? .white : .gray)
            
            Spacer()
            
            if isActive {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 14))
                    .foregroundColor(Color(hex: "22c55e"))
            }
        }
        .padding(12)
        .background(Color(hex: "262626"))
        .cornerRadius(8)
    }
}
