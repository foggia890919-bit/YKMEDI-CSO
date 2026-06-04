/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakSlider */
// Tweaks island for the landing page — background brightness only.
// Signature accent (orange) is fixed in CSS and intentionally NOT tweakable.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "overlay": 6
}/*EDITMODE-END*/;

function TweaksApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--overlay", (t.overlay / 100).toString());
  }, [t.overlay]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="영상 히어로" />
      <TweakSlider
        label="배경 어둡기"
        value={t.overlay}
        min={0} max={85} unit="%"
        onChange={(v) => setTweak("overlay", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<TweaksApp />);
