import SwiftUI

struct ReadyScreen: View {
    @Binding var config: DemoConfig
    @Binding var currentScreen: ContentView.Screen
    
    var device: DeviceInfo {
        DeviceInfo.forVertical(config.selectedVertical, state: config.selectedState)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 8) {
                Image(systemName: "building.2.fill")
                    .font(.system(size: 32))
                    .foregroundColor(Color(hex: "0066CC"))
                
                Text(headerTitle)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundColor(.white)
                
                Text(device.name)
                    .font(.system(size: 16))
                    .foregroundColor(.gray)
            }
            .padding(.top, 60)
            .padding(.bottom, 40)
            
            Spacer()
            
            // Main CTA
            VStack(spacing: 20) {
                Button(action: {
                    currentScreen = .processing
                }) {
                    HStack {
                        Image(systemName: "creditcard.fill")
                            .font(.system(size: 24))
                        Text("Tap badge to begin")
                            .font(.system(size: 20, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [Color(hex: "0066CC"), Color(hex: "004499")]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(16)
                }
                
                Text("Shared device access is verified by identity, device trust, and policy")
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 24)
            
            Spacer()
            
            // Footer Status
            VStack(spacing: 12) {
                HStack {
                    StatusItem(icon: "checkmark.shield.fill", label: "Device", value: device.compliant ? "Compliant" : "Non-Compliant", isGood: device.compliant)
                    Spacer()
                    StatusItem(icon: "arrow.triangle.2.circlepath", label: "Last sync", value: device.lastSync, isGood: true)
                }
                
                HStack {
                    StatusItem(icon: "battery.75", label: "Battery", value: "\(device.battery)%", isGood: device.battery > 20)
                    Spacer()
                    StatusItem(icon: "wifi", label: "Network", value: "Connected", isGood: true)
                }
            }
            .padding(20)
            .background(Color(hex: "1f1f1f"))
            .cornerRadius(16)
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
            
            // Demo Controls
            DemoControls(config: $config)
        }
        .background(Color(hex: "1a1a1a"))
    }
    
    var headerTitle: String {
        switch config.selectedVertical {
        case .healthcare: return "St. Mary's Hospital"
        case .warehouse: return "Acme Logistics"
        case .retail: return "Target Store #2847"
        }
    }
}

struct StatusItem: View {
    let icon: String
    let label: String
    let value: String
    let isGood: Bool
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(isGood ? Color(hex: "22c55e") : Color(hex: "ef4444"))
            
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
                Text(value)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(isGood ? Color(hex: "22c55e") : Color(hex: "ef4444"))
            }
        }
    }
}

struct DemoControls: View {
    @Binding var config: DemoConfig
    
    var body: some View {
        VStack(spacing: 12) {
            Text("Demo Controls")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.gray)
            
            // Vertical Picker
            HStack(spacing: 8) {
                ForEach(Vertical.allCases, id: \.self) { vertical in
                    Button(action: { config.selectedVertical = vertical }) {
                        Text(vertical.rawValue.capitalized)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(config.selectedVertical == vertical ? .white : .gray)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(config.selectedVertical == vertical ? Color(hex: "0066CC") : Color(hex: "2a2a2a"))
                            .cornerRadius(8)
                    }
                }
            }
            
            // State Picker
            HStack(spacing: 8) {
                ForEach(DeviceState.allCases, id: \.self) { state in
                    Button(action: { config.selectedState = state }) {
                        Text(state.rawValue.replacingOccurrences(of: "-", with: " ").capitalized)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(config.selectedState == state ? .white : .gray)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                config.selectedState == state ?
                                (state == .nonCompliant || state == .overdue ? Color(hex: "ef4444") : Color(hex: "22c55e")) :
                                Color(hex: "2a2a2a")
                            )
                            .cornerRadius(6)
                    }
                }
            }
        }
        .padding()
        .background(Color(hex: "0f0f0f"))
    }
}
