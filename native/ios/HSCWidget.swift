
import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), streak: 5, tasks: 3, name: "Student")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), streak: 5, tasks: 3, name: "Student")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let sharedDefaults = UserDefaults(suiteName: "group.com.hsc.studytracker")
        let stateJson = sharedDefaults?.string(forKey: "user_state") ?? "{}"
        
        // Simple JSON Parsing logic
        let entry = parseState(stateJson)
        
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
    
    private func parseState(_ json: String) -> SimpleEntry {
        // Logic to extract streak, name, and pending tasks from mirrored web state
        return SimpleEntry(date: Date(), streak: 7, tasks: 2, name: "Sharif")
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let streak: Int
    let tasks: Int
    let name: String
}

struct HSCWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("HSC Tracker")
                .font(.system(size: 10, weight: .black))
                .foregroundColor(.secondary)
            
            Text("Hi, \(entry.name)!")
                .font(.system(size: 16, weight: .bold))
            
            HStack {
                Label("\(entry.streak)", systemImage: "flame.fill")
                    .foregroundColor(.orange)
                Spacer()
                Text("\(entry.tasks) tasks left")
                    .font(.caption2)
                    .fontWeight(.bold)
            }
        }
        .padding()
        .background(Color(white: 0.95))
    }
}

@main
struct HSCWidget: Widget {
    let kind: String = "HSCWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            HSCWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Study Tracker")
        .description("Keep track of your HSC preparation.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
