import UIKit

/// Main workspace view controller shown during active session
final class ActiveSessionViewController: UIViewController {
    
    // MARK: - Properties
    
    private var session: SessionData? {
        SessionStateManager.shared.currentSession
    }
    
    // MARK: - UI Components
    
    private lazy var headerView: UIView = {
        let view = UIView()
        view.backgroundColor = .systemBlue
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()
    
    private lazy var userLabel: UILabel = {
        let label = UILabel()
        label.font = UIFont.systemFont(ofSize: 20, weight: .semibold)
        label.textColor = .white
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private lazy var roleLabel: UILabel = {
        let label = UILabel()
        label.font = UIFont.systemFont(ofSize: 14, weight: .regular)
        label.textColor = .white.withAlphaComponent(0.8)
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private lazy var endSessionButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("End Session", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        button.backgroundColor = .systemRed
        button.layer.cornerRadius = 8
        button.addTarget(self, action: #selector(endSessionTapped), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()
    
    private lazy var collectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .vertical
        layout.minimumInteritemSpacing = 16
        layout.minimumLineSpacing = 16
        layout.sectionInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
        
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.backgroundColor = .systemGroupedBackground
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        return collectionView
    }()
    
    private lazy var timeoutLabel: UILabel = {
        let label = UILabel()
        label.font = UIFont.systemFont(ofSize: 12, weight: .regular)
        label.textColor = .secondaryLabel
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        configureWithSession()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // Timeout is managed by SessionStateManager
        updateTimeoutDisplay()
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        // Timeout is managed by SessionStateManager
    }
    
    // MARK: - Setup
    
    private func setupUI() {
        view.backgroundColor = .systemGroupedBackground
        
        view.addSubview(headerView)
        headerView.addSubview(userLabel)
        headerView.addSubview(roleLabel)
        headerView.addSubview(endSessionButton)
        view.addSubview(collectionView)
        view.addSubview(timeoutLabel)
        
        NSLayoutConstraint.activate([
            headerView.topAnchor.constraint(equalTo: view.topAnchor),
            headerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            headerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            headerView.heightAnchor.constraint(equalToConstant: 120),
            
            userLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            userLabel.leadingAnchor.constraint(equalTo: headerView.leadingAnchor, constant: 20),
            
            roleLabel.topAnchor.constraint(equalTo: userLabel.bottomAnchor, constant: 4),
            roleLabel.leadingAnchor.constraint(equalTo: headerView.leadingAnchor, constant: 20),
            
            endSessionButton.centerYAnchor.constraint(equalTo: headerView.centerYAnchor),
            endSessionButton.trailingAnchor.constraint(equalTo: headerView.trailingAnchor, constant: -20),
            endSessionButton.widthAnchor.constraint(equalToConstant: 100),
            endSessionButton.heightAnchor.constraint(equalToConstant: 36),
            
            collectionView.topAnchor.constraint(equalTo: headerView.bottomAnchor),
            collectionView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            collectionView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            collectionView.bottomAnchor.constraint(equalTo: timeoutLabel.topAnchor, constant: -8),
            
            timeoutLabel.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -8),
            timeoutLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
        
        // Configure collection view
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.register(AppCell.self, forCellWithReuseIdentifier: "AppCell")
    }
    
    private func configureWithSession() {
        guard let session = session else { return }
        
        userLabel.text = "Welcome, \(session.persona.roleName)"
        roleLabel.text = "Role: \(session.persona.roleName)"
    }
    
    // MARK: - Timeout Display
    
    private func updateTimeoutDisplay() {
        guard let session = currentSession else { return }
        
        // Get idle timeout from session restrictions
        let idleTimeout = session.persona.restrictions.idleTimeout
        timeoutLabel.text = String(format: "Session expires in %02d:00", Int(idleTimeout / 60))
    }
    
    // MARK: - Actions
    
    @objc private func endSessionTapped() {
        let alert = UIAlertController(
            title: "End Session",
            message: "Are you sure you want to end your session? All unsaved work will be lost.",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        alert.addAction(UIAlertAction(title: "End Session", style: .destructive) { [weak self] _ in
            SessionStateManager.shared.endSession(userInitiated: true)
        })
        
        present(alert, animated: true)
    }
}

// MARK: - UICollectionViewDataSource

extension ActiveSessionViewController: UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        session?.persona.appLaunchConfig.requiredApps.count ?? 0
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "AppCell", for: indexPath) as! AppCell
        
        if let apps = session?.persona.appLaunchConfig.requiredApps,
           indexPath.item < apps.count {
            cell.configure(with: apps[indexPath.item])
        }
        
        return cell
    }
}

// MARK: - UICollectionViewDelegate

extension ActiveSessionViewController: UICollectionViewDelegate {
    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        guard let apps = session?.persona.appLaunchConfig.requiredApps,
              indexPath.item < apps.count else { return }
        
        let app = apps[indexPath.item]
        
        Task {
            do {
                try await AppLauncher.shared.launchEnterpriseApp(app)
            } catch {
                showError(error)
            }
        }
    }
    
    private func showError(_ error: Error) {
        let alert = UIAlertController(
            title: "Error",
            message: error.localizedDescription,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - UICollectionViewDelegateFlowLayout

extension ActiveSessionViewController: UICollectionViewDelegateFlowLayout {
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        let itemsPerRow: CGFloat = 3
        let padding: CGFloat = 32
        let availableWidth = collectionView.bounds.width - padding
        let itemWidth = availableWidth / itemsPerRow
        return CGSize(width: itemWidth, height: 100)
    }
}

// MARK: - AppCell

final class AppCell: UICollectionViewCell {
    private lazy var iconImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFit
        imageView.tintColor = .systemBlue
        imageView.translatesAutoresizingMaskIntoConstraints = false
        return imageView
    }()
    
    private lazy var titleLabel: UILabel = {
        let label = UILabel()
        label.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        label.textAlignment = .center
        label.numberOfLines = 2
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setupUI() {
        contentView.backgroundColor = .secondarySystemGroupedBackground
        contentView.layer.cornerRadius = 12
        
        contentView.addSubview(iconImageView)
        contentView.addSubview(titleLabel)
        
        NSLayoutConstraint.activate([
            iconImageView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 16),
            iconImageView.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            iconImageView.widthAnchor.constraint(equalToConstant: 40),
            iconImageView.heightAnchor.constraint(equalToConstant: 40),
            
            titleLabel.topAnchor.constraint(equalTo: iconImageView.bottomAnchor, constant: 8),
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 4),
            titleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -4)
        ])
    }
    
    func configure(with app: EnterpriseApp) {
        iconImageView.image = UIImage(systemName: "app.fill")
        titleLabel.text = app.displayName
    }
}
