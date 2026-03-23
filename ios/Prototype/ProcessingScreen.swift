import SwiftUI

struct ProcessingScreen: View {
    @Binding var config: DemoConfig
    @Binding var currentScreen: ContentView.Screen
    @State private var currentStep = 0
    @State private var stepProgress: [Bool] = [false, false, false, false]
    
    let steps = [
        ("creditcard.fill", "Badge Recognized", "Verifying badge credentials"),
        ("person.fill", "User Identity Mapped", "Looking up user in directory"),
        ("shield.fill", "Device Trust Check", "Checking device compliance"),
        ("checkmark.seal.fill", "Security Policy", "Evaluating access policies")
    ]
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 12) {
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(.white)
                
                Text("Verifying Access")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)
                
                Text("Please wait while we verify your credentials...")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
            }
            .padding(.top, 80)
            .padding(.bottom, 40)
            
            // Steps
            VStack(spacing: 0) {
                ForEach(0..<steps.count, id: \.self) { index in
                    StepRow(
                        icon: steps[index].0,
                        title: steps[index].1,
                        subtitle: steps[index].2,
                        isCompleted: stepProgress[index],
                        isCurrent: index == currentStep,
                        stepNumber: index + 1
                    )
                    
                    if index < steps.count - 1 {
                        Rectangle()
                            .fill(stepProgress[index] ? Color(hex: "22c55e") : Color(hex: "333333"))
                            .frame(width: 2, height: 24)
                            .padding(.leading, 43)
                    }
                }
            }
            .padding(.horizontal, 24)
            
            Spacer()
            
            // Demo Force Buttons
            VStack(spacing: 12) {
                Text("Demo: Force Result")
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
                
                HStack(spacing: 12) {
                    Button(action: {
                        currentScreen = .accessGranted
                    }) {
                        Text("Allow")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color(hex: "22c55e"))
                            .cornerRadius(8)
                    }
                    
                    Button(action: {
                        currentScreen = .accessDenied
                    }) {
                        Text("Deny")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color(hex: "ef4444"))
                            .cornerRadius(8)
                    }
                }
            }
            .padding(24)
            .background(Color(hex: "1f1f1f"))
            .cornerRadius(16)
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .background(Color(hex: "1a1a1a"))
        .onAppear {
            animateSteps()
        }
    }
    
    func animateSteps() {
        for i in 0..<steps.count {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 1.2) {
                withAnimation(.easeInOut(duration: 0.3)) {
                    stepProgress[i] = true
                    currentStep = i + 1
                }
                
                if i == steps.count - 1 {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                        // Auto-advance based on state
                        if config.selectedState == .nonCompliant || config.selectedState == .overdue {
                            currentScreen = .accessDenied
                        } else {
                            currentScreen = .accessGranted
                        }
                    }
                }
            }
        }
    }
}

struct StepRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let isCompleted: Bool
    let isCurrent: Bool
    let stepNumber: Int
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(isCompleted ? Color(hex: "22c55e") : (isCurrent ? Color(hex: "0066CC") : Color(hex: "333333")))
                    .frame(width: 36, height: 36)
                
                if isCompleted {
                    Image(systemName: "checkmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                } else {
                    Text("\(stepNumber)")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                }
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(isCompleted || isCurrent ? .white : .gray)
                
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            if isCurrent {
                ProgressView()
                    .tint(Color(hex: "0066CC"))
            }
        }
        .padding(.vertical, 8)
    }
}
