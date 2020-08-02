module.exports.parser = 'tsx';

const formatStringToCamelCase = str => {
  const splitted = str.split("-");
  if (splitted.length === 1) return splitted[0];
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
  const attributeType = path.node.value.type

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

module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;

  // transform `fileInfo.source` here
  // ...
  // return changed source
  // console.log(Object.keys(api.jscodeshift))
  // console.log(j.JSXIdentifier)
  const root = j(fileInfo.source);
  // console.log({ root })
  const attributes = root.find(j.JSXAttribute)
  attributes.forEach(transformStyleAttribute)
  // const identifier
  return root.toSource();
};