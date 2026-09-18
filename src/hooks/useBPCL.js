import { useEffect } from 'react';
import initConfig from '../bpcl/config.js';
import initContent from '../bpcl/content.js';
import initCore from '../bpcl/core.js';
import initNavigation from '../bpcl/navigation.js';
import initScrollAnimations from '../bpcl/scrollAnimations.js';
import initImageViewer from '../bpcl/imageViewer.js';
import initBlueprintViewer from '../bpcl/blueprintViewer.js';
import initDayNightSlider from '../bpcl/dayNightSlider.js';
import initWalkthrough from '../bpcl/walkthrough.js';

/* BPCL micro-app engine boot — same order as the legacy <script> chain.
   The engines are DOM-driven vanilla modules; React owns the markup and
   route lifecycle, the engine owns its interactive surface. */
export default function useBPCL() {
  useEffect(() => {
    // exact legacy <script> order: config, core, navigation, imageViewer,
    // dayNightSlider, blueprintViewer, walkthrough, content, scrollAnimations
    const mods = [
      ['config', initConfig], ['core', initCore], ['navigation', initNavigation],
      ['imageViewer', initImageViewer], ['dayNightSlider', initDayNightSlider],
      ['blueprintViewer', initBlueprintViewer], ['walkthrough', initWalkthrough],
      ['content', initContent], ['scrollAnimations', initScrollAnimations],
    ];
    for (const [name, init] of mods) { try { init(); } catch (e) { /* isolated engine fault must not blank the page */ console.warn('bpcl engine module failed:', name, e); } }
  }, []);
}
