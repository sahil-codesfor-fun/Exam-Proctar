-- RenameOwlcoderIdToLegacyImportId
-- Renames the owlcoderId column to legacyImportId in Question and HubArticle tables

-- Question table
ALTER TABLE `Question` RENAME COLUMN `owlcoderId` TO `legacyImportId`;

-- HubArticle table
ALTER TABLE `HubArticle` RENAME COLUMN `owlcoderId` TO `legacyImportId`;
