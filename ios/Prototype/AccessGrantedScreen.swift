import SwiftUI

struct AccessGrantedScreen: View {
    @Binding var config: DemoConfig
    @Binding var currentScreen: ContentView.Screen
    
    var device: DeviceInfo {
        DeviceInfo.forVertical(config.selectedVertical, state: .compliant)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Success Header
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(Color(hex: "22c55e").opacity(0.2))
                        .frame(width: 100, height: 100)
                    
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(Color(hex: "22c55e"))
                }
                
                Text("Access Granted")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)
            }
            .padding(.top, 60)
            .padding(.bottom, 40)
            
            // User Info Card
            VStack(spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("User")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                        Text(device.user)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Role")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                        Text(device.role)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                    }
                }
                
                Divider()
                    .background(Color(hex: "333333"))
                
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Device")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                        Text(device.name)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Session")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                        Text("8 hours")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(Color(hex: "22c55e"))
                    }
                }
                
                Divider()
                    .background(Color(hex: "333333"))
                
                HStack {
                    Image(systemName: "location.fill")
                        .foregroundColor(Color(hex: "0066CC"))
                    Text("Return to: \(device.returnLocation)")
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                    Spacer()
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
                    // Launch workspace action
                }) {
                    HStack {
                        Image(systemName: "app.badge")
                        Text("Launch Workspace")
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
                        currentScreen = .ready
                    }) {
                        Text("End Session")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.gray)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(hex: "2a2a2a"))
                            .cornerRadius(10)
                    }
                    
                    Button(action: {
                        currentScreen = .glanceLayer
                    }) {
                        Text("Glance Layer")
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
