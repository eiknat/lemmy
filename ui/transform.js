module.exports.parser = 'tsx';

const formatStringToCamelCase = str => {
  const splitted = str.split("-");
  if (splitted.length === 1) return splitted[0];
  // eslint-ignore-nextline
  return (
    splitted[0] +
    splitted
      .slice(1)
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join("")
  );
};

export const getStyleObjectFromString = str => {
  const style = {};
  str.split(";").forEach(el => {
    const [property, value] = el.split(":");
    if (!property) return;

    const formattedProperty = formatStringToCamelCase(property.trim());
    style[formattedProperty] = value.trim();
  });

  return style;
};

function transformStyleAttribute(path) {
  const attributeName = path.node.name.name
  const attributeType = path.node && path.node.value && path.node.value.type

  if (attributeName === 'style' && attributeType === 'StringLiteral') {
    // TRANSFORM
    const styleString = path.node.value.value;
    const styleObject = getStyleObjectFromString(styleString);

    path.node.value = {
      type: 'JSXExpressionContainer',
      expression: {
        type: 'ObjectExpression',
        properties: Object.entries(styleObject).map(([key, value]) => {
          return {
            "type": "Property",
            "key": {
              "type": "Identifier",
              "name": key
            },
            "value": {
              "type": "Literal",
              "value": value,
              "raw": `'${value}'`
            },
            "kind": "init",
          };
          }
        )
      }
    }
  }
}

// convert all string style attributes to JSX style objects
module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;

  const root = j(fileInfo.source);

  const attributes = root.find(j.JSXAttribute)
  attributes.forEach(transformStyleAttribute)
  return root.toSource();
};