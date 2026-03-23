import SwiftUI

struct GlanceLayerScreen: View {
    @Binding var config: DemoConfig
    
    var device: DeviceInfo {
        DeviceInfo.forVertical(config.selectedVertical, state: config.selectedState)
    }
    
    var borderColor: Color {
        switch config.selectedState {
        case .nonCompliant, .overdue:
            return Color(hex: "ef4444")
        case .dueSoon:
            return Color(hex: "f59e0b")
        default:
            return Color(hex: "22c55e")
        }
    }
    
    var statusColor: Color {
        switch config.selectedState {
        case .nonCompliant, .overdue:
            return Color(hex: "ef4444")
        case .dueSoon:
            return Color(hex: "f59e0b")
        default:
            return Color(hex: "22c55e")
        }
    }
    
    var statusText: String {
        switch config.selectedState {
        case .nonCompliant:
            return "❌ Needs Attention"
        case .overdue:
            return "❌ Overdue"
        case .dueSoon:
            return "⚠️ Due Soon"
        default:
            return "✅ Device OK"
        }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Text("Glance Layer")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                    
                    Text("Device lock screen surface — one glance to know device status")
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 40)
                
                // Controls
                VStack(spacing: 16) {
                    // Vertical Picker
                    HStack(spacing: 8) {
                        ForEach(Vertical.allCases, id: \.self) { vertical in
                            Button(action: { config.selectedVertical = vertical }) {
                                Text(verticalIcon(vertical) + " " + vertical.rawValue.capitalized)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(config.selectedVertical == vertical ? .white : .gray)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(config.selectedVertical == vertical ? Color(hex: "0066CC") : Color(hex: "2a2a2a"))
                                    .cornerRadius(8)
                            }
                        }
                    }
                    
                    // State Picker
                    HStack(spacing: 8) {
                        ForEach(DeviceState.allCases, id: \.self) { state in
                            Button(action: { config.selectedState = state }) {
                                Text(stateLabel(state))
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(config.selectedState == state ? .white : .gray)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 6)
                                    .background(
                                        config.selectedState == state ?
                                        (state == .nonCompliant || state == .overdue ? Color(hex: "ef4444") : (state == .dueSoon ? Color(hex: "f59e0b") : Color(hex: "22c55e"))) :
                                        Color(hex: "2a2a2a")
                                    )
                                    .cornerRadius(6)
                            }
                        }
                    }
                }
                .padding()
                .background(Color(hex: "1f1f1f"))
                .cornerRadius(12)
                .padding(.horizontal, 24)
                
                // Device Card Preview
                VStack(spacing: 0) {
                    // Card Header
                    HStack {
                        Image(systemName: verticalIcon(config.selectedVertical))
                            .font(.system(size: 20))
                            .foregroundColor(Color(hex: "0066CC"))
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(verticalTitle)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                            Text(device.name)
                                .font(.system(size: 12))
                                .foregroundColor(.gray)
                        }
                        Spacer()
                    }
                    .padding(16)
                    .background(borderColor.opacity(0.2))
                    
                    // User Info
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Checked out to:")
                                .font(.system(size: 12))
                                .foregroundColor(.gray)
                            Text(device.user)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 4) {
                            Text("Shift:")
                                .font(.system(size: 12))
                                .foregroundColor(.gray)
                            Text(device.shift)
                                .font(.system(size: 14))
                                .foregroundColor(.white)
                        }
                    }
                    .padding(16)
                    .background(Color(hex: "262626"))
                    
                    // Return Info
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 8) {
                                Image(systemName: "location.fill")
                                    .font(.system(size: 14))
                                    .foregroundColor(Color(hex: "0066CC"))
                                Text("Return to: \(device.returnLocation)")
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(.white)
                            }
                        }
                        Spacer()
                    }
                    .padding(16)
                    .background(Color(hex: "262626"))
                    
                    // Due Time
                    HStack {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 14))
                            .foregroundColor(statusColor)
                        Text(config.selectedState == .overdue ? "OVERDUE" : "Due: \(device.dueTime)")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(statusColor)
                        Spacer()
                    }
                    .padding(16)
                    .background(borderColor.opacity(0.15))
                    
                    // Status Footer
                    HStack {
                        Text(statusText)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(statusColor)
                        Spacer()
                        Text("Synced \(device.lastSync)")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }
                    .padding(16)
                    .background(Color(hex: "262626"))
                }
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(borderColor, lineWidth: 2)
                )
                .cornerRadius(16)
                .padding(.horizontal, 24)
                
                // Why This Matters
                VStack(alignment: .leading, spacing: 16) {
                    Text("Why this matters")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                    
                    VStack(spacing: 12) {
                        BenefitRow(icon: "person.fill", title: "Who has the device", subtitle: "Staff instantly know who is responsible")
                        BenefitRow(icon: "location.fill", title: "Where it belongs", subtitle: "Clear return location eliminates searching")
                        BenefitRow(icon: "clock.fill", title: "When it is due back", subtitle: "Countdown prevents overdue devices")
                        BenefitRow(icon: "exclamationmark.triangle.fill", title: "Whether it needs attention", subtitle: "Color-coded status at a glance")
                    }
                }
                .padding(20)
                .background(Color(hex: "1f1f1f"))
                .cornerRadius(16)
                .padding(.horizontal, 24)
                
                // Buyer Message
                VStack(spacing: 8) {
                    Image(systemName: "quote.opening")
                        .font(.system(size: 24))
                        .foregroundColor(Color(hex: "0066CC"))
                    
                    Text("This is what staff and floor leads see at a glance without opening the admin console.")
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 20)
                }
                .padding(.vertical, 24)
            }
            .padding(.bottom, 40)
        }
        .background(Color(hex: "1a1a1a"))
    }
    
    func verticalIcon(_ vertical: Vertical) -> String {
        switch vertical {
        case .healthcare: return "🏥"
        case .warehouse: return "📦"
        case .retail: return "🛒"
        }
    }
    
    func verticalTitle -> String {
        switch config.selectedVertical {
        case .healthcare: return "St. Mary's Hospital"
        case .warehouse: return "Acme Logistics"
        case .retail: return "Target Store #2847"
        }
    }
    
    func stateLabel(_ state: DeviceState) -> String {
        switch state {
        case .idle: return "Idle"
        case .compliant: return "OK"
        case .dueSoon: return "Due Soon"
        case .overdue: return "Overdue"
        case .nonCompliant: return "Non-Comp"
        }
    }
}

struct BenefitRow: View {
    let icon: String
    let title: String
    let subtitle: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(Color(hex: "0066CC"))
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
            }
            
            Spacer()
        }
    }
}
