import Foundation
import RealityKit
import Darwin

@main
struct PhotoTo3D {
    static func main() async {
        print("PhotoTo3D - Baslatiliyor")
        print(String(repeating: "=", count: 50))
        
        let args = CommandLine.arguments
        
        if args.count < 3 {
            print("")
            print("HATA: Eksik arguman")
            print("Kullanim: PhotoTo3D <input_klasoru> <output_dosyasi>")
            print("Ornek: PhotoTo3D ./uploads/urun1 ./outputs/urun1.usdz")
            print("")
            Darwin.exit(1)
        }
        
        let inputFolder = args[1]
        let outputFile = args[2]
        
        print("Giris klasoru: \(inputFolder)")
        print("Cikis dosyasi: \(outputFile)")
        
        let fileManager = FileManager.default
        var isDirectory: ObjCBool = false
        
        guard fileManager.fileExists(atPath: inputFolder, isDirectory: &isDirectory),
              isDirectory.boolValue else {
            print("HATA: Giris klasoru bulunamadi: \(inputFolder)")
            Darwin.exit(1)
        }
        
        do {
            let files = try fileManager.contentsOfDirectory(atPath: inputFolder)
            let imageFiles = files.filter { 
                $0.lowercased().hasSuffix(".jpg") || 
                $0.lowercased().hasSuffix(".jpeg") || 
                $0.lowercased().hasSuffix(".png") ||
                $0.lowercased().hasSuffix(".heic")
            }
            
            print("Fotograf sayisi: \(imageFiles.count)")
            
            if imageFiles.count < 20 {
                print("UYARI: En az 20 fotograf onerilir.")
            }
            
            print("")
            print("3D model olusturuluyor...")
            print("")
            
            let inputURL = URL(fileURLWithPath: inputFolder)
            let outputURL = URL(fileURLWithPath: outputFile)
            
            let outputDir = outputURL.deletingLastPathComponent()
            try? fileManager.createDirectory(at: outputDir, withIntermediateDirectories: true)
            
            let request = PhotogrammetrySession.Request.modelFile(url: outputURL)
            let session = try PhotogrammetrySession(input: inputURL)
            
            try session.process(requests: [request])
            
            for try await output in session.outputs {
                switch output {
                case .processingComplete:
                    print("")
                    print("TAMAMLANDI")
                    print("Model kaydedildi: \(outputFile)")
                    Darwin.exit(0)
                    
                case .requestProgress(_, let fraction):
                    let percent = Int(fraction * 100)
                    print("Ilerleme: %\(percent)")
                    
                case .requestComplete(_, _):
                    print("Model basariyla olusturuldu")
                    
                case .requestError(_, let error):
                    print("HATA: \(error.localizedDescription)")
                    Darwin.exit(1)
                    
                case .inputComplete:
                    print("Fotograflar yuklendi")
                    
                default:
                    break
                }
            }
            
            // Loop bittiyse başarılı
            Darwin.exit(0)
            
        } catch {
            print("HATA: \(error.localizedDescription)")
            Darwin.exit(1)
        }
    }
}