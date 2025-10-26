// File Attachment Service - Placeholder for file-contact/call associations

const ATTACHMENTS_STORAGE_KEY = 'dimicall-file-attachments';

interface FileAttachmentsData {
  contacts: {
    [contactId: string]: string[]; // contactId -> fileIds
  };
  calls: {
    [callId: string]: string[]; // callId -> fileIds
  };
}

/**
 * Get all attachments from localStorage
 */
function getAllAttachments(): FileAttachmentsData {
  try {
    const data = localStorage.getItem(ATTACHMENTS_STORAGE_KEY);
    return data ? JSON.parse(data) : { contacts: {}, calls: {} };
  } catch (error) {
    console.error('Failed to load attachments:', error);
    return { contacts: {}, calls: {} };
  }
}

/**
 * Save all attachments to localStorage
 */
function saveAttachments(attachments: FileAttachmentsData): void {
  try {
    localStorage.setItem(ATTACHMENTS_STORAGE_KEY, JSON.stringify(attachments));
  } catch (error) {
    console.error('Failed to save attachments:', error);
  }
}

/**
 * Attach a file to a contact
 */
export function attachToContact(fileId: string, contactId: string): void {
  console.log(`📎 [ATTACHMENT] Attaching file ${fileId} to contact ${contactId}`);
  const attachments = getAllAttachments();
  
  if (!attachments.contacts[contactId]) {
    attachments.contacts[contactId] = [];
  }
  
  if (!attachments.contacts[contactId].includes(fileId)) {
    attachments.contacts[contactId].push(fileId);
    saveAttachments(attachments);
    console.log(`✅ [ATTACHMENT] File attached successfully. Total files for contact: ${attachments.contacts[contactId].length}`);
    console.log(`📋 [ATTACHMENT] All attachments:`, attachments);
  } else {
    console.log(`⚠️ [ATTACHMENT] File already attached to this contact`);
  }
}

/**
 * Attach a file to a call
 */
export function attachToCall(fileId: string, callId: string): void {
  const attachments = getAllAttachments();
  
  if (!attachments.calls[callId]) {
    attachments.calls[callId] = [];
  }
  
  if (!attachments.calls[callId].includes(fileId)) {
    attachments.calls[callId].push(fileId);
    saveAttachments(attachments);
  }
}

/**
 * Get all files attached to a contact
 */
export function getContactAttachments(contactId: string): string[] {
  const attachments = getAllAttachments();
  const fileIds = attachments.contacts[contactId] || [];
  console.log(`📂 [ATTACHMENT] Getting attachments for contact ${contactId}: ${fileIds.length} files`);
  console.log(`📋 [ATTACHMENT] File IDs:`, fileIds);
  return fileIds;
}

/**
 * Get all files attached to a call
 */
export function getCallAttachments(callId: string): string[] {
  const attachments = getAllAttachments();
  return attachments.calls[callId] || [];
}

/**
 * Remove a file attachment from a contact
 */
export function removeContactAttachment(fileId: string, contactId: string): void {
  const attachments = getAllAttachments();
  
  if (attachments.contacts[contactId]) {
    attachments.contacts[contactId] = attachments.contacts[contactId].filter(id => id !== fileId);
    
    if (attachments.contacts[contactId].length === 0) {
      delete attachments.contacts[contactId];
    }
    
    saveAttachments(attachments);
  }
}

/**
 * Remove a file attachment from a call
 */
export function removeCallAttachment(fileId: string, callId: string): void {
  const attachments = getAllAttachments();
  
  if (attachments.calls[callId]) {
    attachments.calls[callId] = attachments.calls[callId].filter(id => id !== fileId);
    
    if (attachments.calls[callId].length === 0) {
      delete attachments.calls[callId];
    }
    
    saveAttachments(attachments);
  }
}

/**
 * Get all contacts that have a specific file attached
 */
export function getContactsWithFile(fileId: string): string[] {
  const attachments = getAllAttachments();
  const contactIds: string[] = [];
  
  for (const [contactId, fileIds] of Object.entries(attachments.contacts)) {
    if (fileIds.includes(fileId)) {
      contactIds.push(contactId);
    }
  }
  
  return contactIds;
}

/**
 * Get all calls that have a specific file attached
 */
export function getCallsWithFile(fileId: string): string[] {
  const attachments = getAllAttachments();
  const callIds: string[] = [];
  
  for (const [callId, fileIds] of Object.entries(attachments.calls)) {
    if (fileIds.includes(fileId)) {
      callIds.push(callId);
    }
  }
  
  return callIds;
}

/**
 * Remove all attachments for a file (when file is deleted)
 */
export function removeAllAttachmentsForFile(fileId: string): void {
  const attachments = getAllAttachments();
  
  // Remove from contacts
  for (const contactId in attachments.contacts) {
    attachments.contacts[contactId] = attachments.contacts[contactId].filter(id => id !== fileId);
    
    if (attachments.contacts[contactId].length === 0) {
      delete attachments.contacts[contactId];
    }
  }
  
  // Remove from calls
  for (const callId in attachments.calls) {
    attachments.calls[callId] = attachments.calls[callId].filter(id => id !== fileId);
    
    if (attachments.calls[callId].length === 0) {
      delete attachments.calls[callId];
    }
  }
  
  saveAttachments(attachments);
}
