
const mapArea = itemId => {
  if (!itemId) return "Altro";
  const prefix = itemId.split(".")[0]?.toUpperCase();
  switch (prefix) {
   case "B":
    return "Org";

   case "C":
    return "Admin";

   case "D":
    return "Acct";

   case "E":
    return "Crisi";

   case "F":
    return "IT";

       default:
    return "Altro";
  }
};

const mapPriorita = kbPriority => {
  if (!kbPriority) return "bassa";
  const priority = kbPriority.toUpperCase();
  if (priority === "A") return "alta";
  if (priority === "M") return "media";
  if (priority === "B") return "bassa";
  return "media";

};

const getTiming = (timings, dimension) => {
  if (!timings) return 0;

    const sizeMap = {
    Micro: "micro",
    Piccola: "p",
    Media: "m",
    Grande: "g"
  };
  const key = sizeMap[dimension] || "p";
  const timingStr = timings[key] || timings["p"] || "1m";
  const value = parseInt(timingStr);
  if (isNaN(value)) return 0;

    if (timingStr.includes("s")) return value * 5;
  if (timingStr.includes("m")) return value * 21;
  if (timingStr.includes("g")) return value;
  return 21;

};

module.exports = {
  mapArea: mapArea,
  mapPriorita: mapPriorita,
  getTiming: getTiming
};