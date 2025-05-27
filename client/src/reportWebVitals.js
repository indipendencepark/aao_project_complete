const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import("web-vitals").then((({getCLS: getCLS, getFID: getFID, getFCP: getFCP, getLCP: getLCP, getTTFB: getTTFB}) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    }));
  }
};

export default reportWebVitals;