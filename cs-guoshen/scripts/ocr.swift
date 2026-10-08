import Foundation
import Vision
import ImageIO

// Input: JSON array [{path, time}]. Output: one JSON object per sampled frame.
let args = CommandLine.arguments
guard args.count == 2 else { fatalError("需要帧清单路径") }
let items = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: args[1]))) as! [[String: Any]]
for item in items {
    autoreleasepool {
        var result: [String: Any] = ["path": item["path"]!, "time": item["time"]!]
        do {
            let handler = VNImageRequestHandler(url: URL(fileURLWithPath: item["path"] as! String), options: [:])
            let textRequest = VNRecognizeTextRequest()
            textRequest.recognitionLevel = .accurate
            textRequest.recognitionLanguages = ["zh-Hans", "zh-Hant", "en-US"]
            textRequest.usesLanguageCorrection = false
            textRequest.minimumTextHeight = 0.004
            let barcodeRequest = VNDetectBarcodesRequest()
            try handler.perform([textRequest, barcodeRequest])
            result["lines"] = (textRequest.results ?? []).compactMap { observation -> [String: Any]? in
                guard let candidate = observation.topCandidates(1).first else { return nil }
                let b = observation.boundingBox
                return ["text": candidate.string, "confidence": candidate.confidence,
                        "box": [b.minX, 1 - b.maxY, b.width, b.height]]
            }
            result["codes"] = (barcodeRequest.results ?? []).map { observation -> [String: Any] in
                let b = observation.boundingBox
                return ["type": observation.symbology.rawValue, "payload": observation.payloadStringValue ?? "",
                        "box": [b.minX, 1 - b.maxY, b.width, b.height]]
            }
        } catch { result["error"] = String(describing: error) }
        let data = try! JSONSerialization.data(withJSONObject: result, options: [.sortedKeys])
        print(String(data: data, encoding: .utf8)!)
    }
}
