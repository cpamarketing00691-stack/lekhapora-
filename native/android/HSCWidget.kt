
package com.hsc.studytracker

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import org.json.JSONObject

class HSCWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val prefs = context.getSharedPreferences("HSC_TRACKER_PREFS", Context.MODE_PRIVATE)
        val stateJson = prefs.getString("user_state", "{}")
        val state = JSONObject(stateJson)
        
        val streak = state.optInt("streaks", 0)
        val profile = state.optJSONObject("profile")
        val name = profile?.optString("fullName", "Student") ?: "Student"
        
        val views = RemoteViews(context.packageName, R.layout.hsc_widget_layout)
        views.setTextViewText(R.id.widget_greeting, "Hi, $name!")
        views.setTextViewText(R.id.widget_streak, "$streak Day Streak")
        
        // Update Pending Tasks count
        val tasks = state.optJSONArray("dailyTasks")
        var pending = 0
        if (tasks != null) {
            for (i in 0 until tasks.length()) {
                if (!tasks.getJSONObject(i).optBoolean("isCompleted")) pending++
            }
        }
        views.setTextViewText(R.id.widget_tasks, "$pending Tasks Left")

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
