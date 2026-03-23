import SwiftUI

struct ContentView: View {
    @State private var config = DemoConfig()
    @State private var currentScreen: Screen = .menu
    
    enum Screen: String, CaseIterable {
        case menu = "Demo Menu"
        case ready = "Ready / Awaiting Badge"
        case processing = "Processing"
        case accessGranted = "Access Granted"
        case accessDenied = "Access Denied"
        case glanceLayer = "Glance Layer"
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "1a1a1a")
                    .ignoresSafeArea()
                
                switch currentScreen {
                case .menu:
                    DemoMenuView(currentScreen: $currentScreen)
                case .ready:
                    ReadyScreen(config: $config, currentScreen: $currentScreen)
                case .processing:
                    ProcessingScreen(config: $config, currentScreen: $currentScreen)
                case .accessGranted:
                    AccessGrantedScreen(config: $config, currentScreen: $currentScreen)
                case .accessDenied:
                    AccessDeniedScreen(config: $config, currentScreen: $currentScreen)
                case .glanceLayer:
                    GlanceLayerScreen(config: $config)
                }
            }
            .navigationBarHidden(true)
        }
    }
}

struct DemoMenuView: View {
    @Binding var currentScreen: ContentView.Screen
    
    var body: some View {
        VStack(spacing: 20) {
            Text("SignalGrid")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.white)
            
            Text("Demo Prototype")
                .font(.system(size: 16))
                .foregroundColor(.gray)
            
            VStack(spacing: 12) {
                MenuButton(title: "1. Ready / Awaiting Badge", icon: "🪪", screen: .ready)
                MenuButton(title: "2. Processing / Decision", icon: "⚙️", screen: .processing)
                MenuButton(title: "3. Access Granted", icon: "✅", screen: .accessGranted)
                MenuButton(title: "4. Access Denied", icon: "🚫", screen: .accessDenied)
                MenuButton(title: "5. Glance Layer Preview", icon: "👁️", screen: .glanceLayer)
            }
            .padding(.top, 40)
            
            Spacer()
        }
        .padding(.top, 60)
        .padding(.horizontal, 24)
    }
}

struct MenuButton: View {
    let title: String
    let icon: String
    let screen: ContentView.Screen
    
    var body: some View {
        Button(action: { currentScreen = screen }) {
            HStack {
                Text(icon)
                    .font(.system(size: 20))
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white)
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(.gray)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color(hex: "2a2a2a"))
            .cornerRadius(12)
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    ContentView()
}
