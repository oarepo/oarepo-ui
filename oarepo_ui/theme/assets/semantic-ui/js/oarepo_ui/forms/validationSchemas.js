import { object, string, array } from "yup";

/**
 * Basic RDM deposit validation schema for required fields.
 * Can be extended or customized per repository.
 */
export const rdmDepositValidationSchema = object().shape({
  metadata: object().shape({
    title: string().required("Title is required"),
    resource_type: string().required("Resource type is required"),
    publication_date: string().required("Publication date is required"),
    creators: array()
      .min(1, "At least one creator is required")
      .required("Creators are required"),
  }),
});
