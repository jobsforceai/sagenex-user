"use client";

import Script from "next/script";

/**
 * PostHog via the official HTML-snippet bootstrap. Uses Next.js's
 * <Script> component to inject the auto-loading PostHog snippet before
 * hydration, then init() runs once with our project token. This is the
 * exact pattern PostHog's setup wizard outputs.
 *
 * Why this and not the React provider: posthog-js@1.375 + Next.js 16
 * Turbopack double-bundles the SDK module across server + client, which
 * leaves the client-side instance with an undefined `_request_queue` so
 * capture() silently no-ops. The HTML snippet bypasses the module
 * boundary entirely.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  if (!KEY) return <>{children}</>;
  return (
    <>
      <Script id="posthog-bootstrap" strategy="afterInteractive">{`
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init me ws ws ge fs capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('${KEY}', {
          api_host: '${HOST}',
          person_profiles: 'always',
          capture_pageview: true,
          autocapture: true,
        });
      `}</Script>
      {children}
    </>
  );
}
