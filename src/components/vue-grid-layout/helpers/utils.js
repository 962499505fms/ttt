/**
 * Vue Grid Layout - Utils
 * ES Module format
 */

export function bottom(layout) {
  let max = 0;
  let bottomY;
  for (let i = 0, len = layout.length; i < len; i++) {
    bottomY = layout[i].y + layout[i].h;
    if (bottomY > max) max = bottomY;
  }
  return max;
}

export function cloneLayout(layout) {
  const newLayout = Array(layout.length);
  for (let i = 0, len = layout.length; i < len; i++) {
    newLayout[i] = cloneLayoutItem(layout[i]);
  }
  return newLayout;
}

export function cloneLayoutItem(layoutItem) {
  return JSON.parse(JSON.stringify(layoutItem));
}

export function collides(l1, l2) {
  if (l1 === l2) return false;
  if (l1.x + l1.w <= l2.x) return false;
  if (l1.x >= l2.x + l2.w) return false;
  if (l1.y + l1.h <= l2.y) return false;
  if (l1.y >= l2.y + l2.h) return false;
  return true;
}

export function compact(layout, verticalCompact, currentItem) {
  layout = layout.filter((item) => {
    return !item.isDelete;
  });
  const compareWith = getStatics(layout);
  const sorted = sortLayoutItemsByRowCol(layout);
  const out = Array(layout.length);
  for (let i = 0, len = sorted.length; i < len; i++) {
    let l = sorted[i];
    if (!l.static) {
      l = compactItem(compareWith, l, verticalCompact, currentItem, sorted);
      compareWith.push(l);
      out[layout.indexOf(l)] = l;
      l.moved = false;
    }
  }
  return out;
}

export function compactItem(compareWith, l, verticalCompact, currentItem, Layouts) {
  if (verticalCompact) {
    while (l.y > 0 && !getFirstCollision(compareWith, l)) {
      l.y--;
    }
  }
  let collision;
  while ((collision = getFirstCollision(compareWith, l))) {
    l.y = collision.y + collision.h;
  }
  return l;
}

export function correctBounds(layout, bounds) {
  const collidesWith = getStatics(layout);
  for (let i = 0, len = layout.length; i < len; i++) {
    const l = layout[i];
    if (l.x + l.w > bounds.cols) l.x = bounds.cols - l.w;
    if (l.x < 0) {
      l.x = 0;
      l.w = bounds.cols;
    }
    if (!l.static) collidesWith.push(l);
    else {
      while (getFirstCollision(collidesWith, l)) {
        l.y++;
      }
    }
  }
  return layout;
}

export function getLayoutItem(layout, id) {
  for (let i = 0, len = layout.length; i < len; i++) {
    if (layout[i].i === id) return layout[i];
  }
}

export function getFirstCollision(layout, layoutItem) {
  for (let i = 0, len = layout.length; i < len; i++) {
    if (collides(layout[i], layoutItem)) return layout[i];
  }
}

export function getAllCollisions(layout, layoutItem) {
  return layout.filter(function (l) {
    return collides(l, layoutItem);
  });
}

export function getStatics(layout) {
  return layout.filter(function (l) {
    return l.static;
  });
}

export function resizeElement(layout, l, x, y, w, h, isUserAction, eventName) {
  if (eventName === "resizeend") {
    if (l.static) return layout;
    const sorted = sortLayoutItemsByRowCol(layout);
    const collisions = getAllCollisions(sorted, l);
    for (let i = 0, len = collisions.length; i < len; i++) {
      const collision = collisions[i];
      layout = moveElementAwayFromCollision(
        layout,
        l,
        collision,
        isUserAction
      );
    }
  }
}

export function moveElement(layout, l, x, y, isUserAction, preventCollision) {
  if (l.static) return layout;
  const oldX = l.x;
  const oldY = l.y;
  const movingUp = y && l.y > y;
  if (typeof x === "number") l.x = x;
  if (typeof y === "number") l.y = y;
  l.moved = true;
  let sorted = sortLayoutItemsByRowCol(layout);
  if (movingUp) sorted = sorted.reverse();
  const collisions = getAllCollisions(sorted, l);
  if (preventCollision && collisions.length) {
    l.x = oldX;
    l.y = oldY;
    l.moved = false;
    return layout;
  }
  for (let i = 0, len = collisions.length; i < len; i++) {
    const collision = collisions[i];
    if (collision.moved) continue;
    if (l.y > collision.y && l.y - collision.y > collision.h / 4) continue;
    if (collision.static) {
      layout = moveElementAwayFromCollision(
        layout,
        collision,
        l,
        isUserAction
      );
    } else {
      layout = moveElementAwayFromCollision(
        layout,
        l,
        collision,
        isUserAction
      );
    }
  }

  return layout;
}

export function moveElementAwayFromCollision(
  layout,
  collidesWith,
  itemToMove,
  isUserAction
) {
  const preventCollision = false;
  const colNum = 12; // Default column number
  const minW = 1; // Default minimum width
  
  if (isUserAction) {
    const fakeItem = {
      x: itemToMove.x,
      y: itemToMove.y,
      w: itemToMove.w,
      h: itemToMove.h,
      i: "-1",
    };
    fakeItem.y = Math.max(collidesWith.y - itemToMove.h, 0);
    if (!getFirstCollision(layout, fakeItem)) {
      return moveElement(
        layout,
        itemToMove,
        undefined,
        fakeItem.y,
        preventCollision
      );
    }
  }
  if (collidesWith.y === itemToMove.y) {
    const emptyLayoutR =
      collidesWith.x < itemToMove.x &&
      itemToMove.x + itemToMove.w < colNum &&
      !layout.find(
        (layoutItem) => layoutItem.y === itemToMove.y && layoutItem.x > itemToMove.x
      );
    const emptyLayoutL =
      collidesWith.x > itemToMove.x &&
      itemToMove.x > 0 &&
      !layout.find(
        (layoutItem) => layoutItem.y === itemToMove.y && layoutItem.x < itemToMove.x
      );
    if (emptyLayoutR || emptyLayoutL) {
      let newRightX;
      if (emptyLayoutR) newRightX = itemToMove.x + minW;
      if (emptyLayoutL) newRightX = itemToMove.x - minW;
      return moveElement(
        layout,
        itemToMove,
        newRightX,
        itemToMove.y,
        preventCollision
      );
    }
  }
  return moveElement(
    layout,
    itemToMove,
    undefined,
    itemToMove.y + 1,
    preventCollision
  );
}

export function perc(num) {
  return num * 100 + "%";
}

export function setTransform(top, left, width, height) {
  const translate = "translate3d(" + left + "px," + top + "px,0)";
  return {
    transform: translate,
    WebkitTransform: translate,
    MozTransform: translate,
    msTransform: translate,
    OTransform: translate,
    width: (width > 0 ? width : 0) + "px",
    height: height + "px",
    y: top + "px",
    x: left + "px",
    position: "absolute",
  };
}

export function setTransformRtl(top, right, width, height) {
  const translate = "translate3d(" + right * -1 + "px," + top + "px,0)";
  return {
    transform: translate,
    WebkitTransform: translate,
    MozTransform: translate,
    msTransform: translate,
    OTransform: translate,
    width: (width > 0 ? width : 0) + "px",
    height: height + "px",
    y: top + "px",
    x: right + "px",
    position: "absolute",
  };
}

export function setTopLeft(top, left, width, height) {
  return {
    top: top + "px",
    left: left + "px",
    width: (width > 0 ? width : 0) + "px",
    height: height + "px",
    position: "absolute",
  };
}

export function setTopRight(top, right, width, height) {
  return {
    top: top + "px",
    right: right + "px",
    width: (width > 0 ? width : 0) + "px",
    height: height + "px",
    position: "absolute",
  };
}

export function sortLayoutItemsByRowCol(layout) {
  return [].concat(layout).sort(function (a, b) {
    if (a.y === b.y && a.x === b.x) {
      return 0;
    }
    if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
      return 1;
    }
    return -1;
  });
}

export function findNearestGroup(layout, y, filterArray) {
  const sorted = sortLayoutItemsByRowCol(layout);
  const groups = sorted.filter(
    (item) => filterArray.includes(item.i) && item.y < y
  );
  return groups[groups.length - 1];
}

export function validateLayout(layout, contextName) {
  contextName = contextName || "Layout";
  const subProps = ["x", "y", "w", "h"];
  if (!Array.isArray(layout))
    throw new Error(contextName + " must be an array!");
  for (let i = 0, len = layout.length; i < len; i++) {
    const item = layout[i];
    for (let j = 0; j < subProps.length; j++) {
      if (typeof item[subProps[j]] !== "number") {
        throw new Error(
          "VueGridLayout: " +
            contextName +
            "[" +
            i +
            "]." +
            subProps[j] +
            " must be a number!"
        );
      }
    }
    if (item.static !== undefined && typeof item.static !== "boolean") {
      throw new Error(
        "VueGridLayout: " +
          contextName +
          "[" +
          i +
          "].static must be a boolean!"
      );
    }
  }
}

export function autoBindHandlers(el, fns) {
  fns.forEach(function (key) {
    return (el[key] = el[key].bind(el));
  });
}

export function createMarkup(obj) {
  const keys = Object.keys(obj);
  if (!keys.length) return "";
  let i;
  const len = keys.length;
  let result = "";
  for (i = 0; i < len; i++) {
    const key = keys[i];
    const val = obj[key];
    result += hyphenate(key) + ":" + addPx(key, val) + ";";
  }
  return result;
}

export const IS_UNITLESS = {
  animationIterationCount: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridRow: true,
  gridColumn: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  fillOpacity: true,
  stopOpacity: true,
  strokeDashoffset: true,
  strokeOpacity: true,
  strokeWidth: true,
};

export function addPx(name, value) {
  if (typeof value === "number" && !IS_UNITLESS[name]) {
    return value + "px";
  } else {
    return value;
  }
}

export const hyphenateRE = /([a-z\d])([A-Z])/g;

export function hyphenate(str) {
  return str.replace(hyphenateRE, "$1-$2").toLowerCase();
}

export function findItemInArray(array, property, value) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][property] === value) return true;
  }
  return false;
}

export function findAndRemove(array, property, value) {
  array.forEach(function (result, index) {
    if (result[property] === value) {
      array.splice(index, 1);
    }
  });
}
