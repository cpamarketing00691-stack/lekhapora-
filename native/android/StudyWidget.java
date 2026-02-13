
package com.hsc.studytracker;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONObject;

public class StudyWidget extends AppWidgetProvider {
    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("HSC_TRACKER", Context.MODE_PRIVATE);
        String stateJson = prefs.getString("state", "{}");
        
        try {
            JSONObject state = new JSONObject(stateJson);
            JSONObject profile = state.optJSONObject("profile");
            String name = profile != null ? profile.optString("fullName", "Scholar") : "Scholar";
            int streak = state.optInt("streaks", 0);

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
            views.setTextViewText(R.id.name_text, "Hi, " + name);
            views.setTextViewText(R.id.streak_text, streak + " Day Streak");
            
            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
}
