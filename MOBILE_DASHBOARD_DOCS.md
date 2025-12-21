# Mobile App - Dashboard Screen Documentation: Rank & Progress Component

This document specifically outlines the data requirements and client-side logic for implementing the **Agent Overview Card** and its associated **Rank Progress & Earning Streams** on the user dashboard screen for the Sagenex mobile application.

## 1. Overview

The Agent Overview Card displays the user's profile information, current rank, progress towards the next rank, and a summary of their earning streams. This component requires data from specific API endpoints and client-side calculations.

**Data Fetching Strategy:**
On screen load, the mobile app should make parallel calls to the following primary endpoints to gather all necessary data for this component:

-   `getDashboardData()`: Provides core user data, current package, and earnings multiplier.
-   `getRankProgress()`: Provides detailed rank and progress metrics, including requirements for the next rank.

## 2. Agent Overview Card: Data Mapping

-   **UI:** Shows user's name, avatar, current rank, earnings multiplier (if any), a progress bar towards the next rank, and a list of earning streams.
-   **Data Fields & Sources:**
    -   `name`: From `getDashboardData()` -> `profile.fullName`
    -   `avatarUrl`: From `getDashboardData()` -> `profile.profilePicture`
    -   `currentLevel`: From `getDashboardData()` -> `rank.name`
    -   `nextLevelLabel`: From `getRankProgress()` -> `progress.nextRankName`
    -   `packageUSD`: From `getDashboardData()` -> `package.packageUSD` (Crucial for ROI calculation)
    -   `earningsMultiplier`: From `getDashboardData()` -> `earningsMultiplier` (e.g., `4x`)
    -   `earningsMultiplierDeadline`: From `getDashboardData()` -> `profile.earningsMultiplierDeadline`
    -   `joinDate`: From `getDashboardData()` -> `profile.joinDate`
    -   `progressPct`: **Calculated on the client.** (See Section 3.1 for logic).
    -   `Earning Streams`: **Calculated on the client.** (See Section 3.2 for logic).

## 3. Client-Side Logic for Rank, Progress & Earning Streams

This section details the logic required to calculate the progress percentage and dynamically determine the earning streams to display. This logic is derived from the web app's `AgentOverview.tsx` component.

### 3.1. Calculate Progress Percentage (`progressPct`)

The `progressPct` represents the user's advancement towards the `nextLevelLabel`. It is the **average completion** of all requirements defined for that next rank.

-   **Source Object:** The `requirements` object within `rankProgress.progress`.
    -   **Example `requirements` structure from `getRankProgress()`:**
        ```json
        {
          "directs": { "current": 5, "required": 6 },
          "activeTeam": { "current": 20, "required": 36 }
          // Other requirements might exist depending on the rank
        }
        ```
-   **Calculation Steps:**
    1.  For each individual requirement (e.g., `directs`, `activeTeam`):
        -   Calculate its individual completion percentage: `(current_value / required_value) * 100`.
        -   **Important:** Clamp this percentage between `0` and `100` (inclusive) to prevent values above 100%.
        -   **Edge Case:** If `required_value` is `0` (meaning no requirement for that specific metric), consider that metric `100%` complete.
    2.  Collect all valid individual percentages (only for requirements where `required_value > 0` or if `required_value` was 0 and treated as 100%).
    3.  Calculate the **average** of these individual percentages. This average is your `progressPct`.
    4.  If there are no requirements, or no valid requirements to average (e.g., all `required_value` are 0), `progressPct` should default to `100`.

### 3.2. Determine and Display Earning Streams

This section outlines how to populate the "Earning Streams" list, distinguishing between "Unlocked" and "Next Level Unlocks."

**A. Static Data Requirements (Must be hardcoded in the mobile app):**

```javascript
// Array of all possible ranks in their hierarchical order
const ALL_RANKS = ["Member", "Starter", "Builder", "Leader", "Manager", "Director", "Crown"];

// Array of all possible earning streams and the minimum rank required to unlock each
const ALL_EARNING_STREAMS = [
  { name: "ROI", unlockedAt: "Member" },
  { name: "Direct Bonus (10%)", unlockedAt: "Starter" },
  { name: "Re-invest Bonus (8% → 2%)", unlockedAt: "Starter" },
  { name: "Unilevel Bonus (10% split L1-L6)", unlockedAt: "Starter" },
  { name: "Performance Bonus (5-16%)", unlockedAt: "Builder" },
  { name: "Director Bonus (15% pool)", unlockedAt: "Leader" },
  { name: "Leadership Overriding (18%)", unlockedAt: "Leader" },
  { name: "Travel Fund (3%)", unlockedAt: "Manager" },
  { name: "Car Fund (5%)", unlockedAt: "Director" },
  { name: "House Fund (3%)", unlockedAt: "Crown" },
  { name: "Elite Club Bonus (2%)", unlockedAt: "Crown" },
];
```

**B. Tiered ROI Calculation Logic (Must be implemented in the mobile app):**

This function determines the annual ROI percentage based on the user's `packageUSD`.

```javascript
// Equivalent to src/lib/roi.ts
function getTieredROIRate(packageUSD: number): number {
    if (packageUSD >= 10000) return 0.16; // 16% (Crown)
    if (packageUSD >= 5000) return 0.14;  // 14% (Diamond)
    if (packageUSD >= 2000) return 0.12;  // 12% (Titanium)
    if (packageUSD >= 1000) return 0.10;  // 10% (Platinum)
    if (packageUSD >= 500) return 0.08;   // 8% (Gold)
    if (packageUSD >= 300) return 0.07;   // 7% (Silver - interpolated)
    if (packageUSD >= 100) return 0.06;   // 6% (Bronze)
    if (packageUSD >= 50) return 0.05;    // 5% (Starter)
    return 0; // No ROI for packages less than 50
}
```

**C. Logic to Filter and Present Earning Streams:**

1.  **Get User's Current Rank Index:**
    -   Retrieve `currentLevel` from `getDashboardData()`.
    -   Find its index in the `ALL_RANKS` array: `const currentRankIndex = ALL_RANKS.indexOf(currentLevel);`

2.  **Identify Unlocked Streams:**
    -   Filter `ALL_EARNING_STREAMS` where `ALL_RANKS.indexOf(stream.unlockedAt)` is less than or equal to `currentRankIndex`.
    -   Example: `const unlockedStreams = ALL_EARNING_STREAMS.filter(stream => ALL_RANKS.indexOf(stream.unlockedAt) <= currentRankIndex);`

3.  **Identify Next Level Unlocks:**
    -   Retrieve `nextLevelLabel` from `getRankProgress()`.
    -   Filter `ALL_EARNING_STREAMS` where `stream.unlockedAt` is equal to `nextLevelLabel`.
    -   Example: `const nextLevelUnlocks = ALL_EARNING_STREAMS.filter(stream => stream.unlockedAt === nextLevelLabel);`

4.  **Special Handling for ROI Stream Display:**
    -   Before displaying the earning streams, locate the "ROI" entry in `unlockedStreams`.
    -   Modify its `name` property to include the dynamic percentage obtained from `getTieredROIRate(packageUSD)` (e.g., `"ROI (10%)"`).

## 4. Summary of API Endpoints for this Component

-   `getDashboardData()`: Provides `profile.fullName`, `profile.profilePicture`, `rank.name` (for `currentLevel`), `package.packageUSD`, `earningsMultiplier`, `profile.earningsMultiplierDeadline`, `profile.joinDate`.
-   `getRankProgress()`: Provides `progress.nextRankName` (for `nextLevelLabel`) and `progress.requirements` (for `progressPct` calculation).