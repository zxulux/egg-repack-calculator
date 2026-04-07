import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessionLatest } from "../endpoints/session/latest_GET.schema";
import { getSessionGet } from "../endpoints/session/get_GET.schema";
import { postSessionStart } from "../endpoints/session/start_POST.schema";
import { postEntryAdd } from "../endpoints/entry/add_POST.schema";
import { postEntryUndo } from "../endpoints/entry/undo_POST.schema";
import { postSessionComplete } from "../endpoints/session/complete_POST.schema";
import { postTallyAdjust } from "../endpoints/tally/adjust_POST.schema";
import { postLeftoverSave } from "../endpoints/leftover/save_POST.schema";
import { toast } from "sonner";

export const useLatestSession = () => {
  return useQuery({
    queryKey: ["latestSession"],
    queryFn: () => getSessionLatest(),
  });
};

export const useSessionData = (sessionId: string | null | undefined) => {
  return useQuery({
    queryKey: ["sessionData", sessionId],
    queryFn: () => getSessionGet({ sessionId: sessionId! }),
    enabled: !!sessionId,
  });
};

export const useStartSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postSessionStart(),
    onSuccess: (data) => {
      queryClient.setQueryData(["latestSession"], data);
      queryClient.invalidateQueries({ queryKey: ["latestSession"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start session.");
    },
  });
};

export const useAddEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postEntryAdd,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sessionData", variables.sessionId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add entry.");
    },
  });
};

export const useUndoEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postEntryUndo,
    onSuccess: (_, variables) => {
      toast.success(variables.adjustmentId ? "Adjustment undone" : variables.entryId ? "Entry undone" : "Last entry undone");
      queryClient.invalidateQueries({ queryKey: ["sessionData", variables.sessionId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to undo.");
    },
  });
};

export const useCompleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postSessionComplete,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sessionData", variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ["latestSession"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete session.");
    },
  });
};

export const useAdjustTally = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postTallyAdjust,
    onSuccess: (_, variables) => {
      toast.success("Adjustment applied");
      queryClient.invalidateQueries({ queryKey: ["sessionData", variables.sessionId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to apply adjustment.");
    },
  });
};

export const useSaveLeftovers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postLeftoverSave,
    onSuccess: (_, variables) => {
      toast.success("Leftovers saved successfully");
      queryClient.invalidateQueries({ queryKey: ["sessionData", variables.sessionId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save leftovers.");
    },
  });
};