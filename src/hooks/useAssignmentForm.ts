import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  assignmentFormSchema,
  baseAssignmentFormSchema,
  type AssignmentFormValues,
} from "@/lib/validations/assignment";
import { type AssignmentStep } from "@/types/assignment";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { STEPS } from "@/lib/config/steps";
import { ToastService } from "@/lib/services/toast.service";
import { StepService } from "@/lib/services/step.service";
import { getDefaultValues } from "@/lib/services/assignment-defaults.service";
import { ROUTES } from "@/config/routes";
import { logger } from "@/lib/logger";
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentWithFiles,
} from "@/api/assignment";
import { ASSIGNMENT_KEYS } from "@/query-key/student-assignment";
import { isBasicInfoComplete } from "@/lib/utils/basic-info-validation";