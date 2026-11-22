package tr.tezgah;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.*;

public class Kitchen extends Activity {
  private WebView web;
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    web = new WebView(this);
    web.getSettings().setJavaScriptEnabled(true);
    web.getSettings().setMediaPlaybackRequiresUserGesture(false);
    web.setWebChromeClient(new WebChromeClient() {
      @Override public void onPermissionRequest(PermissionRequest request) {
        runOnUiThread(() -> request.grant(request.getResources()));
      }
    });
    setContentView(web);
    requestPermissions(new String[]{"android.permission.CAMERA", "android.permission.RECORD_AUDIO"}, 1);
    web.loadUrl("file:///android_asset/kitchen.html");
  }
  @Override protected void onPause() {
    if (web != null) web.evaluateJavascript("if(window.stopSession) stopSession()", null);
    super.onPause();
  }
}
