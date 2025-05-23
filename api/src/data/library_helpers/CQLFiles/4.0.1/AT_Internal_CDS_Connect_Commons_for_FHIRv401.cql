// CDS Connect Commons for FHIRv401
// Initial version (1.0.0) based on CDS_Connect_Commons_for_FHIRv400.cql v1.0.1
// with the addition of "EncounterLookBack" and "MedicationDispenseLookBack" functions.
// Change log:
// - 1.1.0
//   - Add functions to align with CDS_Connect_Commons_for_FHIRv400.cql v1.0.4:
//     FirstObservation, AverageObservation, FirstCondition, FirstProcedure,
//     ActiveOrCompletedServiceRequest, ActiveServiceRequest, CompletedServiceRequest,
//     CompletedImmunization, ImmunizationLookBack, MostRecentImmunization, FirstImmunization,
//     and ActiveDevice
// - 1.1.1
//   - Use PeriodToInterval instead of FHIRHelpers.ToInterval for EncounterLookBack
library AT_Internal_CDS_Connect_Commons_for_FHIRv401 version '1.1.1'

using FHIR version '4.0.1'

// Include the FHIRHelpers library for simplifying interacton w/ the FHIR data model
include FHIRHelpers version '4.0.1' called FHIRHelpers

codesystem "AIVERSTATUS": 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification'
codesystem "AICLINSTATUS": 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical'
codesystem "CONDVERSTATUS": 'http://terminology.hl7.org/CodeSystem/condition-ver-status'
codesystem "CONDCLINSTATUS": 'http://terminology.hl7.org/CodeSystem/condition-clinical'
code "AllergyIntolerance Confirmed code": 'confirmed' from "AIVERSTATUS" display 'Confirmed'
code "AllergyIntolerance Active code": 'active' from "AICLINSTATUS" display 'Active'
code "Condition Confirmed code": 'confirmed' from "CONDVERSTATUS" display 'Confirmed'
code "Condition Active code": 'active' from "CONDCLINSTATUS" display 'Active'
code "Condition Recurrence code": 'recurrence' from "CONDCLINSTATUS" display 'Recurrence'
code "Condition Relapse code": 'relapse' from "CONDCLINSTATUS" display 'Relapse'
concept "AllergyIntolerance Confirmed": { "AllergyIntolerance Confirmed code" } display 'Confirmed'
concept "AllergyIntolerance Active": { "AllergyIntolerance Active code" } display 'Active'
concept "Condition Confirmed": { "Condition Confirmed code" } display 'Confirmed'
concept "Condition Active": { "Condition Active code" } display 'Active'
concept "Condition Recurrence": { "Condition Recurrence code" } display 'Recurrence'
concept "Condition Relapse": { "Condition Relapse code" } display 'Relapse'

// -------------------------------------------------- GENERAL ---------------------------------------------------------

/**
 * Converts a FHIR Period to a CQL Interval.  FHIRHelpers provides a function for this, but
 * FHIRHelpers provides several overloads of the ToInterval function, and the JavaScript CQL
 * Execution Framework apparently does not handle this correctly.  Creating uniquely named
 * functions here ensures safe execution.
 * @param period - a FHIR Period
 * @returns {System.Interval} a CQL Interval or null if null was passed in
 */
define function PeriodToInterval(period FHIR.Period):
  if period is null then
    null
  else
    Interval[period."start".value, period."end".value]

/**
 * Converts a FHIR Range to a CQL Interval.  FHIRHelpers provides a function for this, but
 * FHIRHelpers provides several overloads of the ToInterval function, and the JavaScript CQL
 * Execution Framework apparently does not handle this correctly.  Creating uniquely named
 * functions here ensures safe execution.
 * @param range - a FHIR Range
 * @returns {System.Interval} a CQL Interval or null if null was passed in
 */
define function RangeToInterval(range FHIR.Range):
  if range is null then
    null
  else
    Interval[FHIRHelpers.ToQuantity(range.low), FHIRHelpers.ToQuantity(range.high)]

// -------------------------------------------------- OBSERVATIONS -----------------------------------------------------

/**
 * Observations that are complete and verified. In FHIR R4, there are three statuses that indicate this state: 'final',
 * 'corrected', and 'amended'.
 * @see http://hl7.org/fhir/R4/valueset-observation-status.html
 * @param ObsList - a list of Observations
 * @returns {List<Observation>} a list of verified Observations, or null if null was passed in
 */
define function Verified(ObsList List<Observation>):
  ObsList O where O.status.value in {'final', 'corrected', 'amended'}

/**
 * Observations that have quantity values recorded in the requested unit.
 * @param ObsList - a list of Observations
 * @param Unit - the unit to require in the Observations quantity value
 * @returns {List<Observation>} a list of Observations with the required unit, or null if null was passed in
 */
define function WithUnit(ObsList List<Observation>, Unit String):
  ObsList O
    where (O.value as FHIR.Quantity).unit.value = Unit or (O.value as FHIR.Quantity).code.value = Unit

/**
 * Observations with an effective or issued date in the specified "look back" period.  For example, LDL-C Tests in the
 * last 6 years.
 * TODO: Rename to LookBack once the execution engine supports overloaded functions.
 * @param ObsList - a list of Observations
 * @returns {List<Observation>} a list of Observations with effective or issued date specified lookback period, or null
 * if null was passed in
 */
define function ObservationLookBack(ObsList List<Observation>, LookBack System.Quantity):
  ObsList O
    let LookBackInterval: Interval[Now() - LookBack, Now()]
    where (O.effective as FHIR.dateTime).value in LookBackInterval
      or (O.effective as FHIR.instant).value in LookBackInterval
      or PeriodToInterval(O.effective as FHIR.Period) overlaps LookBackInterval
      or O.issued.value in LookBackInterval

/**
 * The most recent observation.  For each Observation, this algorithm will use the Coalesce function, which uses the
 * first non-null date value from these fields: effectiveDateTime, effectiveInstant, effectivePeriod.end,
 * effectivePeriod.start, issued. The found date will be used to compare Observations and determine the most recent
 * one.  NOTE: We can't use FindDate because it appears that the execution engine may have problems sorting by the
 * result of a function.
 * @param ObsList - a list of Observations
 * @returns {Observation} the most recent Observation from the list, or null if null was passed in
 */
define function MostRecent(ObsList List<Observation>):
  Last(ObsList O sort by Coalesce(
    (effective as FHIR.dateTime).value,
    (effective as FHIR.instant).value,
    (effective as FHIR.Period)."end".value,
    (effective as FHIR.Period)."start".value,
    issued.value)
  )

/**
 * The First Observation.  For each Observation, this algorithm will use the Coalesce function, which uses the
 * first non-null date value from these fields: effectiveDateTime, effectiveInstant, effectivePeriod.end,
 * effectivePeriod.start, issued. The found date will be used to compare Observations and determine the most recent
 * one.  NOTE: We can't use FindDate because it appears that the execution engine may have problems sorting by the
 * result of a function.
 * @param ObsList - a list of Observations
 * @returns {Observation} the first Observation from the list, or null if only null elements were passed in
 */
define function FirstObservation(ObsList List<Observation>):
  First(ObsList O sort by Coalesce(
    (effective as FHIR.dateTime).value,
    (effective as FHIR.instant).value,
    (effective as FHIR.Period)."start".value,
    (effective as FHIR.Period)."end".value,
    issued.value)
  )

/**
 * Extracts the quantity value from an Observation, returning it as a CQL Quantity
 * @param Obs - an observation
 * @returns {System.Quantity} the Observation's value as a quantity, or null if there is no quantity value
 */
define function QuantityValue(Obs Observation):
  FHIRHelpers.ToQuantity(Obs.value as FHIR.Quantity)

/**
 * Extracts the CodeableConcept value from an Observation, returning it as a CQL Concept
 * @param Obs - an observation
 * @returns {System.Concept} the Observation's value as a concept, or null if there is no CodeabeConcept value
 */
define function ConceptValue(Obs Observation):
  FHIRHelpers.ToConcept(Obs.value as FHIR.CodeableConcept)

/**
 * Finds the first non-null meaningful date that can be associated with this Observation.  This will look through the
 * following fields in the following order: effectiveDateTime, effectiveInstant, effectivePeriod.end,
 * effectivePeriod.start, issued.
 * @param Obs - an Observation
 * @returns {System.DateTime} the first non-null meaningful date, or null if non is found
 */
define function FindDate(Obs Observation):
  Coalesce(
    (Obs.effective as FHIR.dateTime).value,
    (Obs.effective as FHIR.instant).value,
    (Obs.effective as FHIR.Period)."end".value,
    (Obs.effective as FHIR.Period)."start".value,
    Obs.issued.value
  )

/**
 * The highest observation.
 * The value will be used to compare Observations and determine the highest one.
 * @param ObsList - a list of Observations
 * @returns {System.Quantity} the quantity with the highest value from the list, or null if null was passed in
 */
define function HighestObservation(ObsList List<Observation>):
  Max(ObsList O return FHIRHelpers.ToQuantity(O.value as FHIR.Quantity))

/**
 * The average observation.
 * The value will be used to compare Observations and determine the highest one.
 * @param ObsList - a list of Observations
 * @returns {System.Quantity} containing average value of the non-null elements of the list,
 * or null if all list elements are null.
 */
define function AverageObservation(ObsList List<Observation>):
  Avg(ObsList O return FHIRHelpers.ToQuantity(O.value as FHIR.Quantity))

// -------------------------------------------------- CONDITIONS -------------------------------------------------------

/**
 * Conditions that are confirmed. In FHIR R4, this is reflected by verificationStatus: 'confirmed'.
 * @see http://hl7.org/fhir/R4/valueset-condition-ver-status.html
 * @param CondList - a list of Conditions
 * @returns {List<Condition>} a list of confirmed Conditions, or null if null was passed in
 */
define function Confirmed(CondList List<Condition>):
  CondList C where C.verificationStatus ~ "Condition Confirmed"

/**
 * Conditions that are active. In FHIR R4, this is reflected by clinicalStatus: 'active' and the absence of any
 * abatement information (i.e., if it abated, it is no longer active).
 * TODO: Rename to Active once the execution engine supports overloaded functions.
 * @see http://hl7.org/fhir/R4/valueset-condition-clinical.html
 * @param CondList - a list of Conditions
 * @returns {List<Condition>} a list of active Conditions, or null if null was passed in
 */
define function ActiveCondition(CondList List<Condition>):
  CondList C
    where C.clinicalStatus ~ "Condition Active"
      and C.abatement is null

/**
 * Conditions that are active or recurring. In FHIR R4, this is reflected by clinicalStatus: 'active', 'recurrence', or
 * 'relapse'.  We do not check for null abatement information because it may have dates from when the now recurring
 * condition initially went into remission.
 * @see http://hl7.org/fhir/R4/valueset-condition-clinical.html
 * @param CondList - a list of Conditions
 * @returns {List<Condition>} a list of active or recurring Conditions, or null if null was passed in
 */
define function ActiveOrRecurring(CondList List<Condition>):
  CondList C
    where C.clinicalStatus ~ "Condition Active"
      or C.clinicalStatus ~ "Condition Recurrence"
      or C.clinicalStatus ~ "Condition Relapse"

/**
 * Conditions with an onset or recorded date in the specified "look back" period.  For example, pregnancy in
 * the last 42 weeks.
 * TODO: Rename to LookBack once the execution engine supports overloaded functions.
 * @param CondList - a list of Conditions
 * @returns {List<Condition>} a list of Conditions with onset or recorded date specified lookback period, or null
 * if null was passed in
 */
define function ConditionLookBack(CondList List<Condition>, LookBack System.Quantity):
  CondList C
    let LookBackInterval: Interval[Now() - LookBack, Now()]
    where (C.onset as FHIR.dateTime).value in LookBackInterval
      or PeriodToInterval(C.onset as FHIR.Period) overlaps LookBackInterval
      or C.recordedDate.value in LookBackInterval

/**
 * The most recent condition.  For each Condition, this algorithm will use the Coalesce function, which uses the
 * first non-null result from these fields: onsetDateTime, onsetPeriod.end, onsetPeriod.start, assertedDate.
 * The found date will be used to compare Conditions and determine the most recent one.
 * @param CondList - a list of Conditions
 * @returns {Condition} the most recent Condition from the list, or null if null was passed in
 */
define function MostRecentCondition(CondList List<Condition>):
  Last(CondList C sort by Coalesce(
    (onset as FHIR.dateTime).value,
    (onset as FHIR.Period)."end".value,
    (onset as FHIR.Period)."start".value,
    recordedDate.value)
  )

/**
 * The First condition.  For each Condition, this algorithm will use the Coalesce function, which uses the
 * first non-null result from these fields: onsetDateTime, onsetPeriod.end, onsetPeriod.start, assertedDate.
 * The found date will be used to compare Conditions and determine the most recent one.
 * @param CondList - a list of Conditions
 * @returns {Condition} the first Condition from the list, or null if null was passed in
 */
define function FirstCondition(CondList List<Condition>):
  First(CondList C sort by Coalesce(
    (onset as FHIR.dateTime).value,
    (onset as FHIR.Period)."start".value,
    (onset as FHIR.Period)."end".value,
    recordedDate.value)
  )

 // -------------------------------------------------- PROCEDURES ------------------------------------------------------

/**
 * Procedures that are completed. In FHIR R4, this is reflected by status: 'completed'.
 * @see http://hl7.org/fhir/R4/valueset-event-status.html
 * @param ProcList - a list of Procedures
 * @returns {List<Procedure>} a list of completed Procedures, or null if null was passed in
 */
define function Completed(ProcList List<Procedure>):
  ProcList P
    where P.status.value = 'completed'

/**
 * Procedures that are in progress. In FHIR R4, this is reflected by status: 'in-progress'.
 * @see http://hl7.org/fhir/R4/valueset-event-status.html
 * @param ProcList - a list of Procedures
 * @returns {List<Procedure>} a list of completed Procedures, or null if null was passed in
 */
define function ProcedureInProgress(ProcList List<Procedure>):
  ProcList P
    where P.status.value = 'in-progress'

/**
 * Procedures that actually happened or are happening. In FHIR R4, there are a few properties that negate the
 * procedure, most notably when status is 'preparation', 'not-done', 'entered-in-error', or 'unknown'.
 * @see http://hl7.org/fhir/R4/valueset-event-status.html
 * @param ProcList - a list of Procedures
 * @returns {List<Procedure>} a list of Procedures that actually happened or are happening, or null if null was passed in
 */
define function ProcedurePerformance(ProcList List<Procedure>):
  ProcList P
    where not (P.status.value in {'preparation', 'not-done', 'entered-in-error', 'unknown'})

/**
 * Procedures performed in the specified "look back" period.  For example, PCIs performed in the
 * past 2 weeks.
 * TODO: Rename to LookBack once the execution engine supports overloaded functions.
 * @param ProcList - a list of Procedures
 * @param LookBack - the lookback period for when the procedure was performed
 * @returns {List<Procedure>} a list of Procedures performed in the look back period, or null if null
 * was passed in
 */
define function ProcedureLookBack(ProcList List<Procedure>, LookBack System.Quantity):
  ProcList P
    let LookBackInterval: Interval[Now() - LookBack, Now()]
    where (P.performed as FHIR.dateTime).value in LookBackInterval
      or PeriodToInterval(P.performed as FHIR.Period) overlaps LookBackInterval

/**
 * The most recent procedure.  For each Procedure, this algorithm will use the Coalesce function, which returns the
 * first non-null result from these fields: performedDateTime, performedPeriod.end, performedPeriod.start.
 * The found date will be used to compare Procedures and determine the most recent one.
 * @param ProcList - a list of Procedures
 * @returns {Procedure} the most recent Procedure from the list, or null if null was passed in
 */
define function MostRecentProcedure(ProcList List<Procedure>):
  Last(ProcList P sort by Coalesce(
    (performed as FHIR.dateTime).value,
    (performed as FHIR.Period)."end".value,
    (performed as FHIR.Period)."start".value)
  )

/**
 * The first procedure.  For each Procedure, this algorithm will use the Coalesce function, which returns the
 * first non-null result from these fields: performedDateTime, performedPeriod.end, performedPeriod.start.
 * The found date will be used to compare Procedures and determine the most recent one.
 * @param ProcList - a list of Procedures
 * @returns {Procedure} the first Procedure from the list, or null if null was passed in
 */
define function FirstProcedure(ProcList List<Procedure>):
  First(ProcList P sort by Coalesce(
    (performed as FHIR.dateTime).value,
    (performed as FHIR.Period)."start".value),
    (performed as FHIR.Period)."end".value
  )

// ----------------------------------------------- SERVICEREQUESTS -----------------------------------------------------

// NOTE: In FHIR R4, ProcedureRequest and ReferralRequest are replaced by ServiceRequest

/**
 * ServiceRequests that are active or completed. In FHIR R4, this is reflected by the corresponding
 * status values.
 * @see http://hl7.org/fhir/R4/valueset-request-status.html
 * @param ServiceRequestList - a list of ServiceRequests
 * @returns {List<ServiceRequest>} a list of accepted, in-progress, or completed ProcedureRequests,
 * or null if null was passed in
 * NOTE: This function is deprecated and is maintained only for backwards compatibility
 * Please use C3F.ActiveOrCompletedServiceRequest instead
 */
define function ServiceRequestActiveOrCompleted(ServiceRequestList List<ServiceRequest>):
  ServiceRequestList S
    where S.status.value in List{'active', 'completed'}

/**
 * ServiceRequests that are active or completed. In FHIR R4, this is reflected by the corresponding
 * status values.
 * @see http://hl7.org/fhir/R4/valueset-request-status.html
 * @param ServiceRequestList - a list of ServiceRequests
 * @returns {List<ServiceRequest>} a list of accepted, in-progress, or completed ProcedureRequests,
 * or null if null was passed in
 */
define function ActiveOrCompletedServiceRequest(ServiceRequestList List<ServiceRequest>):
  ServiceRequestList S
    where S.status.value in List{'active', 'completed'}

/**
 * ServiceRequests ordered in the specified "look back" period.  For example, PCIs ordered in the
 * past 2 weeks.
 * TODO: Rename to LookBack once the execution engine supports overloaded functions.
 * @param ServiceRequestList - a list of ServiceRequests
 * @param LookBack - the lookback period for when the service was ordered
 * @returns {List<ServiceRequest>} a list of ServiceRequests ordered in the look back period, or null if null
 * was passed in
 */
define function ServiceRequestLookBack(ServiceRequestList List<ServiceRequest>, LookBack System.Quantity):
  ServiceRequestList S
    where S.authoredOn.value in Interval[Now() - LookBack, Now()]

/**
 * ServiceRequests that are active. In FHIR R4, this is reflected by the corresponding
 * status values.
 * @see http://hl7.org/fhir/R4/valueset-request-status.html
 * @param ServiceRequestList - a list of ServiceRequests
 * @returns {List<ServiceRequest>} a list of active Service Requests,
 * or null if null was passed in
 */
define function ActiveServiceRequest(ServiceRequestList List<ServiceRequest>):
  ServiceRequestList S
    where S.status.value = 'active'

/**
 * ServiceRequests that are completed. In FHIR R4, this is reflected by the corresponding
 * status values.
 * @see http://hl7.org/fhir/R4/valueset-request-status.html
 * @param ServiceRequestList - a list of ServiceRequests
 * @returns {List<ServiceRequest>} a list of completed Service Requests,
 * or null if null was passed in
 */
define function CompletedServiceRequest(ServiceRequestList List<ServiceRequest>):
  ServiceRequestList S
    where S.status.value = 'completed'

// -------------------------------------------------- MEDICATIONS ------------------------------------------------------

/**
 * Medications that are active, according to a statement, but not necessarily verified via a prescription.  For example,
 * medications that a patient has self-reported to be taking.  This may, however, also represent medications that are
 * expected to be active after providing a prescription (e.g., clinician-reported). In FHIR R4, this is reflected by
 * MedicationStatement with status 'active' and no end date or an end date in the future.
 * TODO: Rename to Active once the execution engine supports overloaded functions.
 * @see http://hl7.org/fhir/R4/valueset-medication-statement-status.html
 * @param MedList - a list of MedicationStatements
 * @returns {List<MedicationStatement>} a list of active medication statements, or null if null was passed in
 */
define function ActiveMedicationStatement(MedList List<MedicationStatement>):
  MedList M
    let EffectivePeriod: PeriodToInterval(M.effective as FHIR.Period)
    where M.status.value = 'active'
      and (end of EffectivePeriod is null or end of EffectivePeriod after Now())

/**
* Medication requests that are active.  In FHIR R4, this is reflected by MedicationRequest with status 'active'.
* Note that in R4, the MedicationRequest Boundaries and Relationships now says: "When reporting on the usage of
* a medication by a patient, the MedicationStatement resource should be used." It also indicates that:
* "A medication statement is not a part of the prescribe->dispense->administer sequence but is a report that
* such a sequence (or at least a part of it) did take place resulting in a belief that the patient has received
* a particular medication." In this regard, MedicationStatement is more appropriate as an indication of an actually
* active medication, although it's not clear if vendors really will automatically create MedicationStatements in
* these cases or not.  Until we know, MedicationRequest may be the best proxy we have for an active medication.
* TODO: Should the "intent" field be considered (e.g., is it still active if intent is "proposal" or "plan")?
* TODO: Rename to Active once the execution engine supports overloaded functions.
* @see http://hl7.org/fhir/R4/valueset-medicationrequest-status.html
* @param MedList - a list of MedicationRequests
* @returns {List<MedicationRequest>} a list of active medication requests, or null if null was passed in
*/
define function ActiveMedicationRequest(MedList List<MedicationRequest>):
  MedList M where M.status.value = 'active'

/**
* Medication requests that are active or completed, according to a prescription.  In FHIR R4, this is reflected by MedicationRequest
* with status 'active' or 'completed'.  See the note above (in ActiveMedicationRequest) for more nuance regarding MedicationRequest
* vs. MedicationStatement.
* @see http://hl7.org/fhir/R4/valueset-medicationrequest-status.html
* @param MedList - a list of MedicationRequests
* @returns {List<MedicationRequest>} a list of active medication requests, or null if null was passed in
*/
define function ActiveOrCompletedMedicationRequest(MedList List<MedicationRequest>):
  MedList M
    where M.status.value = 'active'
      or M.status.value = 'completed'

/**
 * Medications that are active or completed, according to a statement, but not necessarily verified via a prescription.
 * For example, medications that a patient has self-reported to be taking.  This may, however, also represent
 * medications that are expected to be active after providing a prescription (e.g., clinician-reported).  In FHIR R4,
 * this is reflected by MedicationStatement with status 'active' or 'completed'.
 * TODO: Rename to ActiveOrCompleted once the execution engine supports overloaded functions.
 * @see http://hl7.org/fhir/R4/valueset-medication-statement-status.html
 * @param MedList - a list of MedicationStatements
 * @returns {List<MedicationStatement>} a list of active or completed medication statements, or null if null was passed
 *   in
 */
define function ActiveOrCompletedMedicationStatement(MedList List<MedicationStatement>):
  MedList M
    where M.status.value = 'active'
      or M.status.value = 'completed'

/**
* Medication requests that are active, completed, or stopped, according to a prescription.  In FHIR R4, this is
* reflected by MedicationRequest with status 'active', 'completed', or 'stopped'. See the note above
* (in ActiveMedicationRequest) for more nuance regarding MedicationRequest vs. MedicationStatement.
* @see http://hl7.org/fhir/R4/valueset-medicationrequest-status.html
* @param MedList - a list of MedicationOrders
* @returns {List<MedicationRequestr>} a list of active medication requests, or null if null was passed in
*/
define function ActiveCompletedOrStoppedMedicationRequest(MedList List<MedicationRequest>):
  MedList M
    where M.status.value = 'active'
      or M.status.value = 'completed'
      or M.status.value = 'stopped'

/**
* Medication requests that are issued in the specified "look back" period.
* TODO: Rename to LookBack once the execution engine supports overloaded functions.
* @param MedList - a list of MedicationRequests
* @param LookBack - the lookback period for when the medication was prescribed
* @returns {List<MedicationRequest>} a list of MedicationRequests prescribed in the look back period, or null if null
* was passed in
*/
define function MedicationRequestLookBack(MedList List<MedicationRequest>, LookBack System.Quantity):
  MedList M
    let LookBackInterval: Interval[Now() - LookBack, Now()]
    where M.authoredOn.value in LookBackInterval
    // DSTU2 also checked the dateEnded property of MedicationOrder, but this doesn't exist for MedicationRequest

/**
* Medication Statements that are issued in the specified "look back" period.
* TODO: Rename to LookBack once the execution engine supports overloaded functions.
* @param MedList - a list of MedicationStatements
* @param LookBack - the lookback period for when the medication was prescribed
* @returns {List<MedicationStatement>} a list of MedicationStatements prescribed in the look back period, or null if null
* was passed in
*/
define function MedicationStatementLookBack(MedList List<MedicationStatement>, LookBack System.Quantity):
  MedList M
    let LookBackInterval: Interval[Now() - LookBack, Now()]
    where (M.effective as FHIR.dateTime).value in LookBackInterval
      or PeriodToInterval(M.effective as FHIR.Period) overlaps LookBackInterval

/**
* Medication Dispenses that are handed over or prepared in the specified "look back" period.
* TODO: Rename to LookBack once the execution engine supports overloaded functions.
* @param MedList - a list of MedicationDispenses
* @param LookBack - the lookback period for when the medication was prescribed
* @returns {List<MedicationStatement>} a list of MedicationDispenses handed over or prepared in the look back period,
* or null if null was passed in
*/
define function MedicationDispenseLookBack(MedList List<MedicationDispense>, LookBack System.Quantity):
  MedList M
    let LookBackInterval: Interval[Now() - LookBack, Now()]
    where M.whenHandedOver.value in LookBackInterval
    or M.whenPrepared.value in LookBackInterval

// -------------------------------------------------- ENCOUNTERS ------------------------------------------------------

/**
 * Encounters that are in progress. In FHIR R4, this is reflected by status: 'in-progress'.
 * @see http://hl7.org/fhir/R4/valueset-encounter-status.html
 * @param EncList - a list of Encounters
 * @returns {List<Encounter>} a list of in progress encounters, or null if null was passed in
 */
define function InProgress(EncList List<Encounter>):
  EncList E
    where E.status.value = 'in-progress'

/**
 * Encounters performed in the specified "look back" period.
 * TODO: Rename to LookBack once the execution engine supports overloaded functions.
 * @param EncList - a list of Encounters
 * @param LookBack - the lookback period for when the encounter occurred
 * @returns {List<Encounter>} a list of Encounters occurring during the look back period, or null if null
 * was passed in
 */
define function EncounterLookBack(EncList List<Encounter>, LookBack System.Quantity):
  EncList E
    let LookBackInterval: Interval[Now() - LookBack, Now()]
    where PeriodToInterval(E.period) overlaps LookBackInterval

// -------------------------------------------------- ALLERGY INTOLERANCES ------------------------------------------------------

/**
* AllergyIntolerances that are active or confirmed.  In FHIR STU3, this is reflected by AllergyIntolerance
* with clinicalStatus 'active' or verificationStatus 'confirmed'
* @see https://www.hl7.org/fhir/R4/valueset-allergy-clinical-status.html
* @see https://www.hl7.org/fhir/R4/valueset-allergy-verification-status.html
* @param AllergyIntolList - a list of AllergyIntolerances
* @returns {List<AllergyIntolerance>} a list of active or confirmed allergy intolerances, or null if null was passed in
*/
define function ActiveOrConfirmedAllergyIntolerance(AllergyIntolList List<AllergyIntolerance>):
  AllergyIntolList A
    where A.clinicalStatus ~ "AllergyIntolerance Active"
      or A.verificationStatus ~ "AllergyIntolerance Confirmed"

// -------------------------------------------------------- GOALS ------------------------------------------------------

/**
 * Goals with a start, target, or status date in the specified "look back" period.  For example, Pain Management Goals
 * in the last 2 years.
 * TODO: Rename to LookBack once the execution engine supports overloaded functions.
 * @param GoalList - a list of Goals
 * @returns {List<Goal>} a list of Goals with a start, target, or status date in the specified lookback period, or null
 * if null was passed in
 */
define function GoalLookBack(GoalList List<Goal>, LookBack System.Quantity):
  GoalList G
    let LookBackInterval: Interval[Now() - LookBack, Now()],
    StartDate: (G.start as FHIR.date).value,
    StatusDate: G.statusDate.value,
    TargetDates: (G.target) T return (T.due as FHIR.date).value,
    TargetQuantities: (G.target) T return FHIRHelpers.ToQuantity(T.due as FHIR.Duration)
    where StartDate in LookBackInterval
      or StatusDate in LookBackInterval
      or exists(TargetDates TD where TD in LookBackInterval)
      or exists(TargetQuantities TQ where (StartDate + TQ) in LookBackInterval)

// -------------------------------------------------- Immunizations ----------------------------------------------------

/**
 * Immunizations that are completed. In FHIR R4, this is reflected by status: 'completed'.
 * @see http://hl7.org/fhir/R4/valueset-immunization-status.html
 * @param ImmunizationList - a list of Immunizations
 * @returns {List<Immunization>} a list of completed Immunizations, or null if null was passed in
 */
define function CompletedImmunization(ImmunizationList List<Immunization>):
  ImmunizationList I
    where I.status.value = 'completed'

/**
 * Immunizations given in the specified "look back" period.
 * TODO: Rename to LookBack once the execution engine supports overloaded functions.
 * @param ImmunizationList - a list of Immunizations
 * @param LookBack - the lookback period for when the immunization was given
 * @returns {List<Immunization>} a list of Immunizations given in the look back period, or null if null
 * was passed in
 */
define function ImmunizationLookBack(ImmunizationList List<Immunization>, LookBack System.Quantity):
  ImmunizationList I
    let LookBackInterval: Interval[Now() - LookBack, Now()]
    where (I.occurrence as FHIR.dateTime).value in LookBackInterval

/**
 * The most recent Immunization.
 * @param ImmunizationList - a list of Immunizations
 * @returns {Immunization} the most recent Immunization from the list, or null if null was passed in
 */
define function MostRecentImmunization(ImmunizationList List<Immunization>):
  Last(ImmunizationList I sort by (occurrence as FHIR.dateTime).value)

/**
 * The First Immunization.
 * @param ImmunizationList - a list of Immunizations
 * @returns {Immunization} the First Immunization from the list, or null if only null elements passed in
 */
define function FirstImmunization(ImmunizationList List<Immunization>):
  First(ImmunizationList I sort by (occurrence as FHIR.dateTime).value)

// ----------------------------------------------------- Devices -------------------------------------------------------

/**
 * Devices that are active. In FHIR R4, this is reflected by status: 'active'.
 * @see http://hl7.org/fhir/R4/valueset-device-status.html
 * @param DeviceList - a list of Devices
 * @returns {List<Device>} a list of active Devices, or null if null was passed in
 */
define function ActiveDevice(DeviceList List<Device>):
  DeviceList D
    where D.status.value = 'active'

// ----------------------------------------------------- FHIR ---------------------------------------------------------

define function ToCoding(code System.Code):
  FHIR.Coding {
    code: FHIR.code { value: code.code },
    system: FHIR.uri { value: code.system },
    display: FHIR.string { value: code.display }
  }