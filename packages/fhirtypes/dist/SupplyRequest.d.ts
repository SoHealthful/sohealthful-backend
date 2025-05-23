/*
 * This is a generated file
 * Do not edit manually.
 */

import { CodeableConcept } from './CodeableConcept';
import { Condition } from './Condition';
import { Device } from './Device';
import { DiagnosticReport } from './DiagnosticReport';
import { DocumentReference } from './DocumentReference';
import { Extension } from './Extension';
import { HealthcareService } from './HealthcareService';
import { Identifier } from './Identifier';
import { Location } from './Location';
import { Medication } from './Medication';
import { Meta } from './Meta';
import { Narrative } from './Narrative';
import { Observation } from './Observation';
import { Organization } from './Organization';
import { Patient } from './Patient';
import { Period } from './Period';
import { Practitioner } from './Practitioner';
import { PractitionerRole } from './PractitionerRole';
import { Quantity } from './Quantity';
import { Range } from './Range';
import { Reference } from './Reference';
import { RelatedPerson } from './RelatedPerson';
import { Resource } from './Resource';
import { Substance } from './Substance';
import { Timing } from './Timing';

/**
 * A record of a request for a medication, substance or device used in
 * the healthcare setting.
 */
export interface SupplyRequest {

  /**
   * This is a SupplyRequest resource
   */
  readonly resourceType: 'SupplyRequest';

  /**
   * The logical id of the resource, as used in the URL for the resource.
   * Once assigned, this value never changes.
   */
  id?: string;

  /**
   * The metadata about the resource. This is content that is maintained by
   * the infrastructure. Changes to the content might not always be
   * associated with version changes to the resource.
   */
  meta?: Meta;

  /**
   * A reference to a set of rules that were followed when the resource was
   * constructed, and which must be understood when processing the content.
   * Often, this is a reference to an implementation guide that defines the
   * special rules along with other profiles etc.
   */
  implicitRules?: string;

  /**
   * The base language in which the resource is written.
   */
  language?: string;

  /**
   * A human-readable narrative that contains a summary of the resource and
   * can be used to represent the content of the resource to a human. The
   * narrative need not encode all the structured data, but is required to
   * contain sufficient detail to make it &quot;clinically safe&quot; for a human to
   * just read the narrative. Resource definitions may define what content
   * should be represented in the narrative to ensure clinical safety.
   */
  text?: Narrative;

  /**
   * These resources do not have an independent existence apart from the
   * resource that contains them - they cannot be identified independently,
   * and nor can they have their own independent transaction scope.
   */
  contained?: Resource[];

  /**
   * May be used to represent additional information that is not part of
   * the basic definition of the resource. To make the use of extensions
   * safe and manageable, there is a strict set of governance  applied to
   * the definition and use of extensions. Though any implementer can
   * define an extension, there is a set of requirements that SHALL be met
   * as part of the definition of the extension.
   */
  extension?: Extension[];

  /**
   * May be used to represent additional information that is not part of
   * the basic definition of the resource and that modifies the
   * understanding of the element that contains it and/or the understanding
   * of the containing element's descendants. Usually modifier elements
   * provide negation or qualification. To make the use of extensions safe
   * and manageable, there is a strict set of governance applied to the
   * definition and use of extensions. Though any implementer is allowed to
   * define an extension, there is a set of requirements that SHALL be met
   * as part of the definition of the extension. Applications processing a
   * resource are required to check for modifier extensions.
   *
   * Modifier extensions SHALL NOT change the meaning of any elements on
   * Resource or DomainResource (including cannot change the meaning of
   * modifierExtension itself).
   */
  modifierExtension?: Extension[];

  /**
   * Business identifiers assigned to this SupplyRequest by the author
   * and/or other systems. These identifiers remain constant as the
   * resource is updated and propagates from server to server.
   */
  identifier?: Identifier[];

  /**
   * Status of the supply request.
   */
  status?: 'draft' | 'active' | 'suspended' | 'cancelled' | 'completed' | 'entered-in-error' | 'unknown';

  /**
   * Category of supply, e.g.  central, non-stock, etc. This is used to
   * support work flows associated with the supply process.
   */
  category?: CodeableConcept;

  /**
   * Indicates how quickly this SupplyRequest should be addressed with
   * respect to other requests.
   */
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';

  /**
   * The item that is requested to be supplied. This is either a link to a
   * resource representing the details of the item or a code that
   * identifies the item from a known list.
   */
  itemCodeableConcept?: CodeableConcept;

  /**
   * The item that is requested to be supplied. This is either a link to a
   * resource representing the details of the item or a code that
   * identifies the item from a known list.
   */
  itemReference?: Reference<Medication | Substance | Device>;

  /**
   * The amount that is being ordered of the indicated item.
   */
  quantity: Quantity;

  /**
   * Specific parameters for the ordered item.  For example, the size of
   * the indicated item.
   */
  parameter?: SupplyRequestParameter[];

  /**
   * When the request should be fulfilled.
   */
  occurrenceDateTime?: string;

  /**
   * When the request should be fulfilled.
   */
  occurrencePeriod?: Period;

  /**
   * When the request should be fulfilled.
   */
  occurrenceTiming?: Timing;

  /**
   * When the request was made.
   */
  authoredOn?: string;

  /**
   * The device, practitioner, etc. who initiated the request.
   */
  requester?: Reference<Practitioner | PractitionerRole | Organization | Patient | RelatedPerson | Device>;

  /**
   * Who is intended to fulfill the request.
   */
  supplier?: Reference<Organization | HealthcareService>[];

  /**
   * The reason why the supply item was requested.
   */
  reasonCode?: CodeableConcept[];

  /**
   * The reason why the supply item was requested.
   */
  reasonReference?: Reference<Condition | Observation | DiagnosticReport | DocumentReference>[];

  /**
   * Where the supply is expected to come from.
   */
  deliverFrom?: Reference<Organization | Location>;

  /**
   * Where the supply is destined to go.
   */
  deliverTo?: Reference<Organization | Location | Patient>;
}

/**
 * The item that is requested to be supplied. This is either a link to a
 * resource representing the details of the item or a code that
 * identifies the item from a known list.
 */
export type SupplyRequestItem = CodeableConcept | Reference<Medication | Substance | Device>;

/**
 * When the request should be fulfilled.
 */
export type SupplyRequestOccurrence = Period | string | Timing;

/**
 * Specific parameters for the ordered item.  For example, the size of
 * the indicated item.
 */
export interface SupplyRequestParameter {

  /**
   * Unique id for the element within a resource (for internal references).
   * This may be any string value that does not contain spaces.
   */
  id?: string;

  /**
   * May be used to represent additional information that is not part of
   * the basic definition of the element. To make the use of extensions
   * safe and manageable, there is a strict set of governance  applied to
   * the definition and use of extensions. Though any implementer can
   * define an extension, there is a set of requirements that SHALL be met
   * as part of the definition of the extension.
   */
  extension?: Extension[];

  /**
   * May be used to represent additional information that is not part of
   * the basic definition of the element and that modifies the
   * understanding of the element in which it is contained and/or the
   * understanding of the containing element's descendants. Usually
   * modifier elements provide negation or qualification. To make the use
   * of extensions safe and manageable, there is a strict set of governance
   * applied to the definition and use of extensions. Though any
   * implementer can define an extension, there is a set of requirements
   * that SHALL be met as part of the definition of the extension.
   * Applications processing a resource are required to check for modifier
   * extensions.
   *
   * Modifier extensions SHALL NOT change the meaning of any elements on
   * Resource or DomainResource (including cannot change the meaning of
   * modifierExtension itself).
   */
  modifierExtension?: Extension[];

  /**
   * A code or string that identifies the device detail being asserted.
   */
  code?: CodeableConcept;

  /**
   * The value of the device detail.
   */
  valueCodeableConcept?: CodeableConcept;

  /**
   * The value of the device detail.
   */
  valueQuantity?: Quantity;

  /**
   * The value of the device detail.
   */
  valueRange?: Range;

  /**
   * The value of the device detail.
   */
  valueBoolean?: boolean;
}

/**
 * The value of the device detail.
 */
export type SupplyRequestParameterValue = boolean | CodeableConcept | Quantity | Range;
