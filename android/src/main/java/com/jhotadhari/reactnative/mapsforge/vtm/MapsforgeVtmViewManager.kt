package com.jhotadhari.reactnative.mapsforge.vtm

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.MapsforgeVtmViewManagerInterface
import com.facebook.react.viewmanagers.MapsforgeVtmViewManagerDelegate

@ReactModule(name = MapsforgeVtmViewManager.NAME)
class MapsforgeVtmViewManager : SimpleViewManager<MapsforgeVtmView>(),
  MapsforgeVtmViewManagerInterface<MapsforgeVtmView> {
  private val mDelegate: ViewManagerDelegate<MapsforgeVtmView>

  init {
    mDelegate = MapsforgeVtmViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<MapsforgeVtmView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): MapsforgeVtmView {
    return MapsforgeVtmView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: MapsforgeVtmView?, color: String?) {
    view?.setBackgroundColor(Color.parseColor(color))
  }

  companion object {
    const val NAME = "MapsforgeVtmView"
  }
}
