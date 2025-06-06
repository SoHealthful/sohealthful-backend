/*
 * This is a generated file
 * Do not edit manually.
 */

import { Extension } from './Extension';
import { Period } from './Period';

/**
 * Details for all kinds of technology mediated contact points for a
 * person or organization, including telephone, email, etc.
 */
export interface ContactPoint {

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
   * Telecommunications form for contact point - what communications system
   * is required to make use of the contact.
   */
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';

  /**
   * The actual contact point details, in a form that is meaningful to the
   * designated communication system (i.e. phone number or email address).
   */
  value?: string;

  /**
   * Identifies the purpose for the contact point.
   */
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';

  /**
   * Specifies a preferred order in which to use a set of contacts.
   * ContactPoints with lower rank values are more preferred than those
   * with higher rank values.
   */
  rank?: number;

  /**
   * Time period when the contact point was/is in use.
   */
  period?: Period;
}
