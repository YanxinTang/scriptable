const params = args.widgetParameter ? args.widgetParameter.split(",") : [];
const _id = params?.[0] ?? "";
const _theme = params?.[1] ?? "auto";

const isDarkTheme =
  _theme === "dark"
    ? true
    : _theme === "light"
    ? false
    : Device.isUsingDarkAppearance();
const padding = 4;

const lightBackgroundColor = new Color("#FFFFFF");
const lightPrimaryColor = new Color("#65c466");
const lightTrailColor = new Color("#000000", 0xa / 256);
const darkBackgroundColor = new Color("#1C1C1E");
const darkPrimaryColor = lightPrimaryColor;
const darkTrailColor = new Color("#FFFFFF", 0xa / 256);
const errorColor = new Color("#FF4D4F");

const backgroundColor = isDarkTheme
  ? darkBackgroundColor
  : lightBackgroundColor;
const defaultProgressbarTheme = {
  primaryColor: isDarkTheme ? darkPrimaryColor : lightPrimaryColor,
  trailColor: isDarkTheme ? darkTrailColor : lightTrailColor,
};

// ENTRY START
const widget = await main();
Script.setWidget(widget);
Script.complete();
// ENTRY END

// main widget
async function main() {
  const widget = new ListWidget();

  widget.setPadding(padding, padding, padding, padding);
  widget.backgroundColor = backgroundColor;

  const data = await getBandwidthData(_id);
  let deg = 0;
  let label = "ERROR";
  let theme = { primaryColor: errorColor };
  if (data) {
    deg = Math.floor((data.bw_counter_b / data.monthly_bw_limit_b) * 360);
    label = bytesToSize(data.bw_counter_b);
    theme = defaultProgressbarTheme;
  }
  const ring = circleProgressbar(deg, label, theme);
  const stack = widget.addStack();
  stack.addImage(ring);

  widget.presentSmall();
  return widget;
}

/* utils */

/**
 * @param {number} deg      0-360
 * @param {string} label    text in the center of progressbar
 * @param {Object} theme
 * @return {Image}
 */
function circleProgressbar(deg, label, theme) {
  const size = 200;
  const lineWidth = 16;
  const fontsize = 40;
  theme = { ...defaultProgressbarTheme, ...theme };

  const ctr = new Point(size / 2, size / 2);
  const diameter = size - lineWidth * 2;
  const radius = diameter / 2;

  const canvas = new DrawContext();
  canvas.size = new Size(size, size);
  canvas.opaque = false;

  canvas.setFillColor(theme.primaryColor);
  canvas.setStrokeColor(theme.trailColor);
  canvas.setLineWidth(20);

  // draw trail line
  canvas.strokeEllipse(new Rect(lineWidth, lineWidth, diameter, diameter));

  // draw primary line
  for (t = 0; t < deg; t++) {
    x = ctr.x + radius * sinDeg(t) - lineWidth / 2;
    y = ctr.y - radius * cosDeg(t) - lineWidth / 2;
    canvas.fillEllipse(new Rect(x, y, lineWidth, lineWidth));
  }

  // draw label
  if (label) {
    canvas.setTextAlignedCenter();
    canvas.setFont(Font.mediumSystemFont(fontsize));
    canvas.setTextColor(theme.primaryColor);

    const innerDiameter = size - lineWidth * 2;
    const innerRectSize = innerDiameter * sinDeg(45);
    const labelWrapperRect = new Rect(0, (size - fontsize) / 2, size, fontsize);
    canvas.drawTextInRect(label, labelWrapperRect);
  }

  return canvas.getImage();
}

async function getBandwidthData(id) {
  try {
    const url = `https://justmysocks5.net/members/getbwcounter.php?service=180118&id=${id}`;
    const req = new Request(url);
    return await req.loadJSON();
  } catch (error) {
    return null;
  }
}

function bytesToSize(bytes) {
  var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}

function sinDeg(deg) {
  return Math.sin((deg * Math.PI) / 180);
}

function cosDeg(deg) {
  return Math.cos((deg * Math.PI) / 180);
}
