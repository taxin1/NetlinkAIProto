package com.networklinkai.app;

import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        configureWebViewForTouch();
    }

    private void configureWebViewForTouch() {
        if (getBridge() == null) return;

        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        WebSettings settings = webView.getSettings();
        settings.setDomStorageEnabled(true);

        webView.setVerticalScrollBarEnabled(true);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setOverScrollMode(WebView.OVER_SCROLL_IF_CONTENT_SCROLLS);
        webView.setNestedScrollingEnabled(true);
    }
}
