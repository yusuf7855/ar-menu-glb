// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PhotoTo3D",
    platforms: [
        .macOS(.v14)
    ],
    targets: [
        .executableTarget(
            name: "PhotoTo3D",
            dependencies: [],
            path: "Sources"
        )
    ]
)