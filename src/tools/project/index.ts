/**
 * Project Tools - FreshBooks project management
 *
 * Exports all project-related MCP tools for organizing work and billing.
 */

// Export schemas

// Export tool definitions
export { projectListTool, handleProjectList } from "./project-list.js";
export { projectSingleTool, handleProjectSingle } from "./project-single.js";
export { projectCreateTool, handleProjectCreate } from "./project-create.js";
export { projectUpdateTool, handleProjectUpdate } from "./project-update.js";
export { projectDeleteTool, handleProjectDelete } from "./project-delete.js";
