// Run this in browser console to fix localStorage issues
console.log("🔧 BugSnap Storage Cleanup Tool");

// Check current selectedBug value
const currentValue = localStorage.getItem("selectedBug");
console.log("Current selectedBug value:", currentValue);

if (currentValue === "undefined" || currentValue === "null" || currentValue === "") {
  console.log("❌ Found corrupted selectedBug data, cleaning up...");
  localStorage.removeItem("selectedBug");
  console.log("✅ Cleaned up corrupted selectedBug data");
} else if (currentValue) {
  try {
    const parsed = JSON.parse(currentValue);
    if (!parsed || !parsed._id) {
      console.log("❌ Found invalid selectedBug data (missing _id), cleaning up...");
      localStorage.removeItem("selectedBug");
      console.log("✅ Cleaned up invalid selectedBug data");
    } else {
      console.log("✅ selectedBug data appears valid:", parsed.title || "Untitled");
    }
  } catch (e) {
    console.log("❌ Found corrupted selectedBug JSON, cleaning up...");
    localStorage.removeItem("selectedBug");
    console.log("✅ Cleaned up corrupted selectedBug JSON");
  }
} else {
  console.log("ℹ️ No selectedBug data found in localStorage");
}

console.log("🏁 Storage cleanup complete. Please refresh the page.");