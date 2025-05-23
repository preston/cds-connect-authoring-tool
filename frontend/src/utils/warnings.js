import Validators from './validators';
import { getReturnType, allModifiersValid, getFieldWithId, getFieldWithType } from './instances';

export function doesBaseElementInstanceNeedWarning(instance, allInstancesInAllTrees) {
  const isBaseElement = instance.usedBy;
  if (isBaseElement) {
    return instance.usedBy.some(usageId => {
      const use = allInstancesInAllTrees.find(i => i.uniqueId === usageId);
      if (use) {
        const useCommentField = getFieldWithId(use.fields, 'comment');
        const useCommentValue = useCommentField && useCommentField.value ? useCommentField.value : '';
        const useNameField = getFieldWithId(use.fields, 'element_name');
        const instanceCommentField = getFieldWithId(instance.fields, 'comment');
        const instanceCommentValue =
          instanceCommentField && instanceCommentField.value ? instanceCommentField.value : '';
        const instanceNameField = getFieldWithId(instance.fields, 'element_name');

        if (
          ((use.modifiers && use.modifiers.length > 0) || instanceCommentValue !== useCommentValue) &&
          instanceNameField.value === useNameField.value
        ) {
          return true;
        }
      }

      return false;
    });
  }

  return false;
}

export function doesBaseElementUseNeedWarning(instance, baseElements) {
  const elementNameField = getFieldWithId(instance.fields, 'element_name');
  const instanceCommentField = getFieldWithId(instance.fields, 'comment');
  const instanceCommentValue = instanceCommentField?.value || '';

  if (instance.type === 'baseElement') {
    const referenceField = getFieldWithType(instance.fields, 'reference');
    const originalBaseElement = baseElements.find(baseEl => referenceField.value.id === baseEl.uniqueId);
    const originalCommentField = getFieldWithId(originalBaseElement.fields, 'comment');
    const originalCommentValue = originalCommentField?.value || '';
    const originalNameField = getFieldWithId(originalBaseElement.fields, 'element_name');
    // If some modifiers applied AND the name is the same as original, it should be changed. Need a warning.
    if (
      ((instance.modifiers && instance.modifiers.length > 0) || instanceCommentValue !== originalCommentValue) &&
      elementNameField.value === originalNameField.value
    ) {
      return true;
    }
    return false;
  }

  return false;
}

export function doesParameterUseNeedWarning(instance, parameters) {
  const elementNameField = getFieldWithId(instance.fields, 'element_name');
  const instanceCommentField = getFieldWithId(instance.fields, 'comment');
  const instanceCommentValue = instanceCommentField && instanceCommentField.value ? instanceCommentField.value : '';

  if (instance.type === 'parameter') {
    const referenceField = getFieldWithType(instance.fields, 'reference');
    const originalParameter = parameters.find(param => referenceField.value.id === param.uniqueId);
    const originalCommentValue = originalParameter && originalParameter.comment ? originalParameter.comment : '';
    // If some modifiers applied AND the name is the same as original, it should be changed. Need a warning.
    if (
      ((instance.modifiers && instance.modifiers.length > 0) || instanceCommentValue !== originalCommentValue) &&
      elementNameField.value === originalParameter.name
    ) {
      return true;
    }
    return false;
  }

  return false;
}

export function doesParameterNeedUsageWarning(name, usedBy, comment, allInstancesInAllTrees) {
  if (usedBy && usedBy.length > 0) {
    let anyUseHasChanged = false;
    usedBy.forEach(usageId => {
      const use = allInstancesInAllTrees.find(i => i.uniqueId === usageId);
      if (use) {
        const useCommentField = getFieldWithId(use.fields, 'comment');
        const useCommentValue = useCommentField && useCommentField.value ? useCommentField.value : '';
        const useNameField = getFieldWithId(use.fields, 'element_name');
        const instanceCommentValue = comment || '';
        if (
          ((use.modifiers && use.modifiers.length > 0) || instanceCommentValue !== useCommentValue) &&
          name === useNameField.value
        ) {
          anyUseHasChanged = true;
        }
      }
    });
    return anyUseHasChanged;
  }

  return false;
}

export function hasDuplicateName(templateInstance, instanceNames, baseElements, parameters, allInstancesInAllTrees) {
  const elementNameField = getFieldWithId(templateInstance.fields, 'element_name');
  // Treat undefined as empty string so unnamed elements display duplicate correctly.
  const nameValue = elementNameField.value === undefined ? '' : elementNameField.value;
  const duplicateNameIndex = instanceNames.findIndex(name => {
    const isDuplicate = name.id !== templateInstance.uniqueId && name.name === nameValue;
    // If base element use, don't include a duplicate from the original base element.
    if (isDuplicate && templateInstance.type === 'baseElement') {
      const referenceField = getFieldWithType(templateInstance.fields, 'reference');
      const originalBaseElement = baseElements.find(baseEl => referenceField.value.id === baseEl.uniqueId);
      // If the duplicate is another of the uses, don't consider duplicate unless that use has changed.
      const anotherUseId = originalBaseElement.usedBy.find(id => id === name.id);
      const anotherUse = allInstancesInAllTrees.find(instance => instance.uniqueId === anotherUseId);
      if (anotherUse) {
        const anotherUseModified = anotherUse.modifiers && anotherUse.modifiers.length > 0;
        return anotherUseModified;
      }
      // If it is a base element that is used in the Base Elements tab, it can also be used by others. Check those uses.
      if (templateInstance.usedBy) {
        const usesUseId = templateInstance.usedBy.find(id => id === name.id);
        const usesUse = allInstancesInAllTrees.find(instance => instance.uniqueId === usesUseId);
        if (usesUse) {
          const usesUseModified = usesUse.modifiers && usesUse.modifiers.length > 0;
          return usesUseModified;
        }
      }
      return name.id !== originalBaseElement.uniqueId;
    } else if (isDuplicate && templateInstance.type === 'parameter') {
      // If parameter use, don't include a duplicate from the original parameter.
      const referenceField = getFieldWithType(templateInstance.fields, 'reference');
      const originalParameter = parameters.find(param => referenceField.value.id === param.uniqueId);
      // If the duplicate is another of the uses, don't consider duplicate unless that use has changed.
      const anotherUseId = originalParameter.usedBy ? originalParameter.usedBy.find(id => id === name.id) : null;
      const anotherUse = allInstancesInAllTrees.find(instance => instance.uniqueId === anotherUseId);
      if (anotherUse) {
        const anotherUseModified = anotherUse.modifiers && anotherUse.modifiers.length > 0;
        return anotherUseModified;
      }
      return name.id !== originalParameter.uniqueId;
    } else if (isDuplicate && templateInstance.usedBy) {
      // If the duplicate is one of the uses, don't consider name duplicate unless use has changed.
      const useId = templateInstance.usedBy.find(i => i === name.id);
      if (useId) {
        const useInstance = allInstancesInAllTrees.find(instance => instance.uniqueId === useId);
        const isUseModified = useInstance && useInstance.modifiers && useInstance.modifiers.length > 0;
        return isUseModified;
      }
      return isDuplicate;
    }
    return isDuplicate;
  });
  return duplicateNameIndex !== -1;
}

export function parameterHasDuplicateName(parameterName, id, usedBy, instanceNames, allInstancesInAllTrees) {
  const duplicateNameIndex = instanceNames.findIndex(name => {
    const isDuplicate = name.id !== id && name.name === parameterName;
    if (isDuplicate && usedBy && usedBy.length > 0) {
      // If the duplicate is one of the uses, don't consider name duplicate unless use has changed.
      const useId = usedBy.find(i => i === name.id);
      if (useId) {
        const useInstance = allInstancesInAllTrees.find(instance => instance.uniqueId === useId);
        const isUseModified = useInstance && useInstance.modifiers && useInstance.modifiers.length > 0;
        return isUseModified;
      }
    }
    return isDuplicate;
  });
  return duplicateNameIndex !== -1;
}

export function validateElement(instance) {
  const templateInstanceFields = instance.fields.reduce(
    (previous, current) => ({
      ...previous,
      [current.id]: current.value
    }),
    {}
  );
  if (instance.validator) {
    const validator = Validators[instance.validator.type];
    const validatorFields = instance.validator.fields;
    const args = instance.validator.args;
    const values = validatorFields.map(f => templateInstanceFields[f]);
    const names = validatorFields.map(f => instance.fields.find(el => el.id === f).name);
    if (!validator.check(values, args)) {
      return validator.warning(names, args);
    }
  }
  return null;
}

// If validateReturnType is null/undefined, it will validate the return type because null/undefined !== false
export function hasReturnTypeError(startingReturnType, modifiers, validReturnType, validateReturnType) {
  const currentReturnType = getReturnType(startingReturnType, modifiers);
  return currentReturnType !== validReturnType && validateReturnType !== false;
}

// Nested warning is needed if a group has a duplicate name
// and if there is any type of warning on any child, including other groups.
export function hasGroupNestedWarning(
  childInstances,
  instanceNames,
  baseElements,
  parameters,
  allInstancesInAllTrees,
  validateReturnType
) {
  let hasNestedWarning = false;
  childInstances.forEach(child => {
    let warning = false;
    if (child.conjunction) {
      warning = hasGroupNestedWarning(
        child.childInstances,
        instanceNames,
        baseElements,
        parameters,
        allInstancesInAllTrees,
        validateReturnType
      );
      if (!warning) {
        warning = hasDuplicateName(child, instanceNames, baseElements, parameters, allInstancesInAllTrees);
      }
    } else {
      const fields = {};
      child.fields.forEach(field => {
        fields[field.id] = field.value;
      });

      const hasValidateElementWarning = validateElement(child, fields) !== null;
      const hasReturnTypeWarning = hasReturnTypeError(child.returnType, child.modifiers, 'boolean', validateReturnType);
      const hasModifierWarning = !allModifiersValid(child.modifiers);
      const hasDuplicateNameWarning = hasDuplicateName(
        child,
        instanceNames,
        baseElements,
        parameters,
        allInstancesInAllTrees
      );
      const hasBaseElementUseWarning = doesBaseElementUseNeedWarning(child, baseElements);
      const hasBaseElementInstanceWarning = doesBaseElementInstanceNeedWarning(child, allInstancesInAllTrees);
      const hasParameterUseWarning = doesParameterUseNeedWarning(child, parameters);

      warning =
        hasValidateElementWarning ||
        hasReturnTypeWarning ||
        hasModifierWarning ||
        hasDuplicateNameWarning ||
        hasBaseElementUseWarning ||
        hasBaseElementInstanceWarning ||
        hasParameterUseWarning;
    }
    if (warning) {
      hasNestedWarning = true;
    }
  });
  return hasNestedWarning;
}

export function hasInvalidListWarning(returnType) {
  return returnType.toLowerCase() === 'invalid';
}

export function isEmptyIntersect(listInstance) {
  return (
    listInstance.returnType === 'list_of_any' &&
    listInstance.name === 'Intersect' &&
    listInstance.childInstances.length > 0
  );
}

export function isSubpopulationEmpty(subpopulation) {
  return subpopulation.childInstances && subpopulation.childInstances.length < 1;
}

export function isSubpopulationUsed(recommendations, uniqueId) {
  return recommendations.some(rec => rec.subpopulations.some(s => s.uniqueId === uniqueId));
}

// Get all errors on a top level ListGroup
export const getListGroupErrors = (listInstance, instanceNames, baseElements, parameters, allInstancesInAllTrees) => {
  const doesHaveDuplicateName = hasDuplicateName(
    listInstance,
    instanceNames,
    baseElements,
    parameters,
    allInstancesInAllTrees
  );
  const doesHaveBaseElementWarning = doesBaseElementInstanceNeedWarning(listInstance, allInstancesInAllTrees);
  const listIsEmptyIntersect = isEmptyIntersect(listInstance);
  const isInvalidList =
    (listInstance.id === 'And' || listInstance.id === 'Or') && hasInvalidListWarning(listInstance.returnType);
  const listAlerts = [
    {
      alertSeverity: 'error',
      alertMessage: 'Warning: Name already in use. Choose another name.',
      showAlert: doesHaveDuplicateName && !doesHaveBaseElementWarning
    },
    {
      alertSeverity: 'error',
      alertMessage: 'Warning: One or more uses of this Base Element have changed. Choose another name.',
      showAlert: doesHaveBaseElementWarning
    },
    {
      alertSeverity: 'warning',
      alertMessage: 'Warning: Intersecting different types will always result in an empty list.',
      showAlert: listIsEmptyIntersect
    },
    {
      alertSeverity: 'warning',
      alertMessage: "Warning: Elements in groups combined with and/or must all have return type 'boolean'.",
      showAlert: isInvalidList
    }
  ];
  return listAlerts;
};

// Get all errors on a top-level Subpopulation
export const getSubpopulationErrors = (subpopulation, recommendations, instanceNames) => {
  const doesHaveEmptySubpopulationWarning = isSubpopulationEmpty(subpopulation);
  const doesHaveDuplicateName =
    instanceNames.findIndex(
      name => name.id !== subpopulation.uniqueId && name.name === subpopulation.subpopulationName
    ) !== -1;
  const doesHaveSubpopulationUsedAlert = isSubpopulationUsed(recommendations, subpopulation.uniqueId);
  const subpopulationAlerts = [
    {
      alertSeverity: 'error',
      alertMessage: 'Warning: This subpopulation needs at least one element.',
      showAlert: doesHaveEmptySubpopulationWarning
    },
    {
      alertSeverity: 'error',
      alertMessage: 'Warning: Name already in use. Choose another name.',
      showAlert: doesHaveDuplicateName
    },
    {
      alertSeverity: 'info',
      alertMessage: "Subpopulation name can't be changed while it is being used in a recommendation.",
      showAlert: doesHaveSubpopulationUsedAlert
    }
  ];

  return subpopulationAlerts;
};

// Get all errors on an element using the above util functions
export const getElementErrors = (elementInstance, allInstancesInAllTrees, baseElements, instanceNames, parameters) => {
  const doesHaveDuplicateName = hasDuplicateName(
    elementInstance,
    instanceNames,
    baseElements,
    parameters,
    allInstancesInAllTrees
  );
  const doesHaveBaseElementUseWarning = doesBaseElementUseNeedWarning(elementInstance, baseElements);
  const doesHaveBaseElementInstanceWarning = doesBaseElementInstanceNeedWarning(
    elementInstance,
    allInstancesInAllTrees
  );
  const doesHaveParameterUseWarning = doesParameterUseNeedWarning(elementInstance, parameters);

  const elementAlerts = [
    {
      alertSeverity: 'error',
      alertMessage: 'Warning: Name already in use. Choose another name.',
      showAlert:
        doesHaveDuplicateName &&
        !doesHaveBaseElementUseWarning &&
        !doesHaveBaseElementInstanceWarning &&
        !doesHaveParameterUseWarning
    },
    {
      alertSeverity: 'error',
      alertMessage: 'Warning: This use of the Base Element has changed. Choose another name.',
      showAlert: doesHaveBaseElementUseWarning
    },
    {
      alertSeverity: 'error',
      alertMessage: 'Warning: One or more uses of this Base Element have changed. Choose another name.',
      showAlert: doesHaveBaseElementInstanceWarning
    },
    {
      alertSeverity: 'error',
      alertMessage: 'Warning: This use of the Parameter has changed. Choose another name.',
      showAlert: doesHaveParameterUseWarning
    }
  ];

  return elementAlerts;
};

// Check if an element has any any warnings using the above util functions
export const hasWarnings = (
  templateInstance,
  instanceNames,
  baseElements,
  parameters,
  allInstancesInAllTrees,
  validateReturnType
) => {
  // Use function for group warnings with a list of just this element to check for all types of warnings.
  const hasSomeWarning = hasGroupNestedWarning(
    [templateInstance],
    instanceNames,
    baseElements,
    parameters,
    allInstancesInAllTrees,
    validateReturnType
  );

  return hasSomeWarning;
};
