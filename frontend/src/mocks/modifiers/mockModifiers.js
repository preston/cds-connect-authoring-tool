const elementLists = [
  'list_of_observations',
  'list_of_conditions',
  'list_of_medication_statements',
  'list_of_medication_requests',
  'list_of_procedures',
  'list_of_allergy_intolerances',
  'list_of_encounters',
  'list_of_immunizations',
  'list_of_devices',
  'list_of_any',
  'list_of_booleans',
  'list_of_service_requests',
  'list_of_system_quantities',
  'list_of_system_concepts',
  'list_of_system_codes',
  'list_of_integers',
  'list_of_datetimes',
  'list_of_strings',
  'list_of_decimals',
  'list_of_times',
  'list_of_others'
];
const everyElement = elementLists.concat([
  'boolean',
  'system_quantity',
  'system_concept',
  'system_code',
  'observation',
  'condition',
  'medication_statement',
  'medication_request',
  'procedure',
  'allergy_intolerance',
  'encounter',
  'immunization',
  'device',
  'service_request',
  'integer',
  'datetime',
  'decimal',
  'string',
  'time',
  'interval_of_integer',
  'interval_of_datetime',
  'interval_of_decimal',
  'interval_of_quantity',
  'any',
  'other'
]);

const mockModifiers = [
  // Observations
  {
    id: 'VerifiedObservation',
    name: 'Verified',
    inputTypes: ['list_of_observations'],
    returnType: 'list_of_observations',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.Verified'
  },
  {
    id: 'WithUnit',
    name: 'With Unit',
    inputTypes: ['list_of_observations'],
    returnType: 'list_of_observations',
    values: { unit: undefined },
    validator: { type: 'require', fields: ['unit'], args: null },
    cqlTemplate: 'WithUnit',
    cqlLibraryFunction: 'C3F.WithUnit'
  },
  {
    id: 'ValueComparisonNumber',
    name: 'Value Comparison',
    inputTypes: ['integer', 'decimal'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['minValue', 'minOperator'], args: null },
    values: { minOperator: undefined, minValue: '', maxOperator: undefined, maxValue: '', unit: '' },
    cqlTemplate: 'ValueComparisonNumber',
    comparisonOperator: null
  },
  {
    id: 'ValueComparisonObservation',
    name: 'Value Comparison',
    inputTypes: ['system_quantity'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['minValue', 'minOperator', 'unit'], args: null },
    values: { minOperator: undefined, minValue: '', maxOperator: undefined, maxValue: '', unit: '' },
    cqlTemplate: 'ValueComparisonObservation',
    comparisonOperator: null
  },
  {
    id: 'QuantityValue',
    name: 'Quantity Value',
    inputTypes: ['observation'],
    returnType: 'system_quantity',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.QuantityValue'
  },
  {
    id: 'ConceptValue',
    name: 'Concept Value',
    inputTypes: ['observation'],
    returnType: 'system_concept',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.ConceptValue'
  },
  {
    id: 'Qualifier',
    name: 'Qualifier',
    inputTypes: ['system_concept', 'system_code'],
    returnType: 'boolean',
    validator: { type: 'requiredIfThenOne', fields: ['qualifier', 'valueSet', 'code'] },
    values: { qualifier: undefined, valueSet: null, code: null },
    cqlTemplate: null,
    cqlLibraryFunction: null
  },
  {
    id: 'ConvertObservation',
    name: 'Convert Units',
    inputTypes: ['system_quantity'],
    returnType: 'system_quantity',
    values: { value: '', templateName: '' },
    validator: { type: 'require', fields: ['value'], args: null },
    cqlTemplate: 'BaseModifier'
    // cqlLibraryFunction is left off because it gets set based on option selected.
  },
  {
    id: 'HighestObservationValue',
    name: 'Highest Observation Value',
    inputTypes: ['list_of_observations'],
    returnType: 'system_quantity',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.HighestObservation'
  },
  {
    id: 'AverageObservationValue',
    name: 'Average Observation Value',
    inputTypes: ['list_of_observations'],
    returnType: 'system_quantity',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.AverageObservation'
  },
  // conditions
  {
    id: 'ConfirmedCondition',
    name: 'Confirmed',
    inputTypes: ['list_of_conditions'],
    returnType: 'list_of_conditions',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.Confirmed'
  },
  {
    id: 'ActiveOrRecurring',
    name: 'Active Or Recurring',
    inputTypes: ['list_of_conditions'],
    returnType: 'list_of_conditions',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.ActiveOrRecurring'
  },
  {
    id: 'ActiveCondition',
    type: 'Active',
    name: 'Active',
    inputTypes: ['list_of_conditions'],
    returnType: 'list_of_conditions',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.ActiveCondition'
  },
  // procedures
  {
    id: 'CompletedProcedure',
    name: 'Completed',
    inputTypes: ['list_of_procedures'],
    returnType: 'list_of_procedures',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.Completed'
  },
  {
    id: 'InProgressProcedure',
    name: 'In Progress',
    inputTypes: ['list_of_procedures'],
    returnType: 'list_of_procedures',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.ProcedureInProgress'
  },
  // medications
  {
    id: 'ActiveMedicationStatement',
    name: 'Active',
    inputTypes: ['list_of_medication_statements'],
    returnType: 'list_of_medication_statements',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.ActiveMedicationStatement'
  },
  {
    id: 'ActiveMedicationRequest',
    name: 'Active',
    inputTypes: ['list_of_medication_requests'],
    returnType: 'list_of_medication_requests',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.ActiveMedicationRequest'
  },
  // allergy intolerances
  {
    id: 'ActiveOrConfirmedAllergyIntolerance',
    name: 'Active Or Confirmed',
    inputTypes: ['list_of_allergy_intolerances'],
    returnType: 'list_of_allergy_intolerances',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.ActiveOrConfirmedAllergyIntolerance'
  },
  // immunizations
  {
    id: 'CompletedImmunization',
    name: 'Completed',
    inputTypes: ['list_of_immunizations'],
    returnType: 'list_of_immunizations',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.CompletedImmunization'
  },
  // devices
  {
    id: 'ActiveDevice',
    name: 'Active',
    inputTypes: ['list_of_devices'],
    returnType: 'list_of_devices',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.ActiveDevice'
  },

  // strings
  {
    id: 'EqualsString',
    name: 'Equals',
    inputTypes: ['string'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value'], args: [] },
    values: { value: undefined },
    cqlTemplate: 'CenterModifierString',
    cqlLibraryFunction: '='
  },
  {
    id: 'EndsWithString',
    name: 'Ends With',
    inputTypes: ['string'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value'], args: [] },
    values: { value: undefined },
    cqlTemplate: 'ValueComparison',
    cqlLibraryFunction: 'EndsWith'
  },
  {
    id: 'StartsWithString',
    name: 'Starts With',
    inputTypes: ['string'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value'], args: [] },
    values: { value: undefined },
    cqlTemplate: 'ValueComparison',
    cqlLibraryFunction: 'StartsWith'
  },
  // times
  {
    id: 'BeforeTimePrecise',
    name: 'Before',
    inputTypes: ['time'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['time'], args: [] },
    values: { time: undefined, precision: undefined },
    cqlTemplate: 'CenterModifierTimePrecise',
    cqlLibraryFunction: 'before'
  },
  {
    id: 'AfterTimePrecise',
    name: 'After',
    inputTypes: ['time'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['time'], args: [] },
    values: { time: undefined, precision: undefined },
    cqlTemplate: 'CenterModifierTimePrecise',
    cqlLibraryFunction: 'after'
  },
  // datetimes
  {
    id: 'BeforeDateTimePrecise',
    name: 'Before',
    inputTypes: ['datetime'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['date'], args: [] },
    values: { date: undefined, time: undefined, precision: undefined },
    cqlTemplate: 'CenterModifierDateTimePrecise',
    cqlLibraryFunction: 'before'
  },
  {
    id: 'AfterDateTimePrecise',
    name: 'After',
    inputTypes: ['datetime'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['date'], args: [] },
    values: { date: undefined, time: undefined, precision: undefined },
    cqlTemplate: 'CenterModifierDateTimePrecise',
    cqlLibraryFunction: 'after'
  },
  // intervals
  {
    id: 'ContainsInteger',
    name: 'Contains',
    inputTypes: ['interval_of_integer'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value'], args: [] },
    values: { value: undefined },
    cqlTemplate: 'CenterModifier',
    cqlLibraryFunction: 'contains'
  },
  {
    id: 'ContainsDateTime',
    name: 'Contains',
    inputTypes: ['interval_of_datetime'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['date'], args: [] },
    values: { date: undefined, time: undefined },
    cqlTemplate: 'CenterModifierDateTime',
    cqlLibraryFunction: 'contains'
  },
  {
    id: 'ContainsDecimal',
    name: 'Contains',
    inputTypes: ['interval_of_decimal'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value'], args: [] },
    values: { value: undefined },
    cqlTemplate: 'CenterModifier',
    cqlLibraryFunction: 'contains'
  },
  {
    id: 'ContainsQuantity',
    name: 'Contains',
    inputTypes: ['interval_of_quantity'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value', 'unit'], args: [] },
    values: { value: undefined, unit: undefined },
    cqlTemplate: 'CenterModifierQuantity',
    cqlLibraryFunction: 'contains'
  },
  {
    id: 'BeforeInteger',
    name: 'Before',
    inputTypes: ['interval_of_integer'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value'], args: [] },
    values: { value: undefined },
    cqlTemplate: 'CenterModifier',
    cqlLibraryFunction: 'before'
  },
  {
    id: 'BeforeDateTime',
    name: 'Before',
    inputTypes: ['interval_of_datetime'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['date'], args: [] },
    values: { date: undefined, time: undefined },
    cqlTemplate: 'CenterModifierDateTime',
    cqlLibraryFunction: 'before'
  },
  {
    id: 'BeforeDecimal',
    name: 'Before',
    inputTypes: ['interval_of_decimal'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value'], args: [] },
    values: { value: undefined },
    cqlTemplate: 'CenterModifier',
    cqlLibraryFunction: 'before'
  },
  {
    id: 'BeforeQuantity',
    name: 'Before',
    inputTypes: ['interval_of_quantity'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value', 'unit'], args: [] },
    values: { value: undefined, unit: undefined },
    cqlTemplate: 'CenterModifierQuantity',
    cqlLibraryFunction: 'before'
  },
  {
    id: 'AfterInteger',
    name: 'After',
    inputTypes: ['interval_of_integer'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value'], args: [] },
    values: { value: undefined },
    cqlTemplate: 'CenterModifier',
    cqlLibraryFunction: 'after'
  },
  {
    id: 'AfterDateTime',
    name: 'After',
    inputTypes: ['interval_of_datetime'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['date'], args: [] },
    values: { date: undefined, time: undefined },
    cqlTemplate: 'CenterModifierDateTime',
    cqlLibraryFunction: 'after'
  },
  {
    id: 'AfterDecimal',
    name: 'After',
    inputTypes: ['interval_of_decimal'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value'], args: [] },
    values: { value: undefined },
    cqlTemplate: 'CenterModifier',
    cqlLibraryFunction: 'after'
  },
  {
    id: 'AfterQuantity',
    name: 'After',
    inputTypes: ['interval_of_quantity'],
    returnType: 'boolean',
    validator: { type: 'require', fields: ['value', 'unit'], args: [] },
    values: { value: undefined, unit: undefined },
    cqlTemplate: 'CenterModifierQuantity',
    cqlLibraryFunction: 'after'
  },
  // ALL
  // Most Recent
  {
    id: 'MostRecentObservation',
    name: 'Most Recent',
    inputTypes: ['list_of_observations'],
    returnType: 'observation',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.MostRecent'
  },
  {
    id: 'MostRecentCondition',
    name: 'Most Recent',
    inputTypes: ['list_of_conditions'],
    returnType: 'condition',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.MostRecentCondition'
  },
  {
    id: 'MostRecentProcedure',
    name: 'Most Recent',
    inputTypes: ['list_of_procedures'],
    returnType: 'procedure',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.MostRecentProcedure'
  },
  {
    id: 'MostRecentImmunization',
    name: 'Most Recent',
    inputTypes: ['list_of_immunizations'],
    returnType: 'immunization',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.MostRecentImmunization'
  },
  // First
  {
    id: 'FirstObservation',
    name: 'First',
    inputTypes: ['list_of_observations'],
    returnType: 'observation',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.FirstObservation'
  },
  {
    id: 'FirstCondition',
    name: 'First',
    inputTypes: ['list_of_conditions'],
    returnType: 'condition',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.FirstCondition'
  },
  {
    id: 'FirstProcedure',
    name: 'First',
    inputTypes: ['list_of_procedures'],
    returnType: 'procedure',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.FirstProcedure'
  },
  {
    id: 'FirstImmunization',
    name: 'First',
    inputTypes: ['list_of_immunizations'],
    returnType: 'immunization',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.FirstImmunization'
  },
  // Look Back
  {
    id: 'LookBackObservation',
    type: 'LookBack',
    name: 'Look Back',
    inputTypes: ['list_of_observations'],
    returnType: 'list_of_observations',
    values: { value: undefined, unit: undefined },
    validator: { type: 'require', fields: ['value', 'unit'], args: null },
    cqlTemplate: 'LookBackModifier',
    cqlLibraryFunction: 'C3F.ObservationLookBack'
  },
  {
    id: 'LookBackCondition',
    type: 'LookBack',
    name: 'Look Back',
    inputTypes: ['list_of_conditions'],
    returnType: 'list_of_conditions',
    values: { value: undefined, unit: undefined },
    validator: { type: 'require', fields: ['value', 'unit'], args: null },
    cqlTemplate: 'LookBackModifier',
    cqlLibraryFunction: 'C3F.ConditionLookBack'
  },
  {
    id: 'LookBackMedicationRequest',
    type: 'LookBack',
    name: 'Look Back',
    inputTypes: ['list_of_medication_requests'],
    returnType: 'list_of_medication_requests',
    values: { value: undefined, unit: undefined },
    cqlTemplate: 'LookBackModifier',
    cqlLibraryFunction: 'C3F.MedicationRequestLookBack'
  },
  {
    id: 'LookBackMedicationStatement',
    type: 'LookBack',
    name: 'Look Back',
    inputTypes: ['list_of_medication_statements'],
    returnType: 'list_of_medication_statements',
    values: { value: undefined, unit: undefined },
    cqlTemplate: 'LookBackModifier',
    cqlLibraryFunction: 'C3F.MedicationStatementLookBack'
  },
  {
    id: 'LookBackProcedure',
    type: 'LookBack',
    name: 'Look Back',
    inputTypes: ['list_of_procedures'],
    returnType: 'list_of_procedures',
    values: { value: undefined, unit: undefined },
    validator: { type: 'require', fields: ['value', 'unit'], args: null },
    cqlTemplate: 'LookBackModifier',
    cqlLibraryFunction: 'C3F.ProcedureLookBack'
  },
  {
    id: 'LookBackImmunization',
    type: 'LookBack',
    name: 'Look Back',
    inputTypes: ['list_of_immunizations'],
    returnType: 'list_of_immunizations',
    values: { value: undefined, unit: undefined },
    validator: { type: 'require', fields: ['value', 'unit'], args: null },
    cqlTemplate: 'LookBackModifier',
    cqlLibraryFunction: 'C3F.ImmunizationLookBack'
  },
  {
    id: 'LookBackServiceRequest',
    type: 'LookBack',
    name: 'Look Back',
    inputTypes: ['list_of_service_requests'],
    returnType: 'list_of_service_requests',
    values: { value: undefined, unit: undefined },
    validator: { type: 'require', fields: ['value', 'unit'], args: null },
    cqlTemplate: 'LookBackModifier',
    cqlLibraryFunction: 'C3F.ServiceRequestLookBack'
  },
  {
    id: 'LookBackEncounter',
    type: 'LookBack',
    name: 'Look Back',
    inputTypes: ['list_of_service_requests'],
    returnType: 'list_of_service_requests',
    values: { value: undefined, unit: undefined },
    validator: { type: 'require', fields: ['value', 'unit'], args: null },
    cqlTemplate: 'LookBackModifier',
    cqlLibraryFunction: 'C3F.EncounterLookBack'
  },
  {
    id: 'Count',
    name: 'Count',
    inputTypes: elementLists,
    returnType: 'integer',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'Count'
  },
  {
    id: 'BooleanExists',
    name: 'Exists',
    inputTypes: elementLists,
    returnType: 'boolean',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'exists'
  },
  {
    id: 'BooleanComparison',
    name: 'Is (Not) True/False?',
    inputTypes: ['boolean'],
    returnType: 'boolean',
    values: { value: undefined },
    validator: { type: 'require', fields: ['value'], args: null },
    cqlTemplate: 'postModifier',
    comparisonOperator: null
  },
  {
    id: 'CheckExistence',
    name: 'Is (Not) Null?',
    inputTypes: everyElement,
    returnType: 'boolean',
    values: { value: undefined },
    cqlTemplate: 'postModifier',
    comparisonOperator: null,
    validator: { type: 'require', fields: ['value'], args: null }
  },
  {
    id: 'BooleanNot',
    name: 'Not',
    inputTypes: ['boolean'],
    returnType: 'boolean',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'not'
  },
  {
    id: 'InProgress',
    name: 'In Progress',
    inputTypes: ['list_of_encounters'],
    returnType: 'list_of_encounters',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.InProgress'
  },
  {
    id: 'AllTrue',
    name: 'All True',
    inputTypes: ['list_of_booleans'],
    returnType: 'boolean',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'AllTrue'
  },
  {
    id: 'AnyTrue',
    name: 'Any True',
    inputTypes: ['list_of_booleans'],
    returnType: 'boolean',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'AnyTrue'
  },
  // Service Requests
  {
    id: 'ActiveOrCompletedServiceRequest',
    name: 'Active Or Completed',
    inputTypes: ['list_of_service_requests'],
    returnType: 'list_of_service_requests',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.ActiveOrCompletedServiceRequest'
  },
  {
    id: 'ActiveServiceRequest',
    name: 'Active',
    inputTypes: ['list_of_service_requests'],
    returnType: 'list_of_service_requests',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.ActiveServiceRequest'
  },
  {
    id: 'CompletedServiceRequest',
    name: 'Completed',
    inputTypes: ['list_of_service_requests'],
    returnType: 'list_of_service_requests',
    cqlTemplate: 'BaseModifier',
    cqlLibraryFunction: 'C3F.CompletedServiceRequest'
  }
];

export default mockModifiers;
