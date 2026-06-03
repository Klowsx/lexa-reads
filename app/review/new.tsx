import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { useMyReview } from "~/features/book/hooks/useMyReview";
import { useUpsertReview } from "~/features/book/hooks/useUpsertReview";
import { MAX_REVIEW_LENGTH } from "~/lib/content-limits";
import { useColors } from "~/theme/colors";

// ─── Validación con Zod ───────────────────────────────────────

// El body requiere al menos 10 caracteres para forzar una reseña
// mínimamente útil en lugar de "muy bueno" o similar, y un tope que
// refleja el CHECK de DB (016_content_length_limits.sql).
const reviewSchema = z.object({
  body: z
    .string()
    .min(10, "La reseña debe tener al menos 10 caracteres")
    .max(MAX_REVIEW_LENGTH, `Máximo ${MAX_REVIEW_LENGTH} caracteres`),
  containsSpoilers: z.boolean(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

// ─── Pantalla ─────────────────────────────────────────────────

export default function NewReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  // bookId viene de la URL: /review/new?bookId=xxx
  const { bookId } = useLocalSearchParams<{ bookId: string }>();

  // Cargamos la reseña existente para precargarlo si es una edición.
  const { data: existingReview, isLoading: loadingReview } = useMyReview(bookId ?? "");
  const isEditing = !!existingReview;

  // Mutación para crear o actualizar — el hook decide INSERT vs UPDATE
  // basándose en si params.reviewId está presente.
  const upsertMutation = useUpsertReview(bookId ?? "");

  // react-hook-form con zod como resolver de validación.
  // defaultValues vacíos inicialmente; reset() los rellena cuando carga existingReview.
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { body: "", containsSpoilers: false },
    // revalidamos en cada cambio para que el botón se active en tiempo real
    mode: "onChange",
  });

  useEffect(() => {
    if (existingReview) {
      reset({
        body: existingReview.body,
        containsSpoilers: existingReview.contains_spoilers ?? false,
      });
    }
  }, [existingReview?.id, existingReview?.body, existingReview?.contains_spoilers]);

  const bodyValue = watch("body");
  const charCount = bodyValue?.length ?? 0;

  function onSubmit(values: ReviewFormValues) {
    if (!bookId) return;

    upsertMutation.mutate(
      {
        bookId,
        body: values.body,
        containsSpoilers: values.containsSpoilers,
        // Si existe reseña → edición; si no → creación.
        reviewId: existingReview?.id,
        userBookId: existingReview?.user_book_id ?? undefined,
      },
      {
        // onSuccess al nivel de la llamada: volvemos atrás solo si hay éxito.
        // Los errores ya los maneja queryClient.defaultOptions.mutations.onError
        // mostrando un toast automático.
        onSuccess: () => router.back(),
      },
    );
  }

  // Mostramos un spinner mientras cargamos la reseña existente para
  // no mostrar el formulario en blanco antes de precargarlo.
  if (loadingReview) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    // Stack.Screen permite configurar la presentación de esta ruta
    // como un modal nativo sin modificar _layout.tsx.
    <>
      <Stack.Screen
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />

      <KeyboardAvoidingView
        className="flex-1 bg-bg"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {/* Drag handle — apariencia de sheet */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-5 pt-3 pb-4">
            <Text className="font-display-sb text-md text-text">
              {isEditing ? "Editar reseña" : "Escribir reseña"}
            </Text>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="w-8 h-8 items-center justify-center"
            >
              {/* Símbolo × más legible que un icono de lucide para cerrar */}
              <Text className="text-lg font-body text-t2">×</Text>
            </Pressable>
          </View>

          <View className="px-5">
            {/* ── Texto de la reseña ──────────────────────── */}
            <View className="mb-4">
              <Text className="text-xs font-body-sb text-t3 uppercase tracking-widest mb-1.5">
                Tu reseña
              </Text>

              <Controller
                control={control}
                name="body"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    maxLength={MAX_REVIEW_LENGTH}
                    // ~8 líneas de altura mínima para invitar a escribir más
                    numberOfLines={8}
                    placeholder="¿Qué te pareció el libro? Comparte tu opinión..."
                    placeholderTextColor={c.t3}
                    className="rounded-card bg-sr border text-text font-body text-sm px-[14px] py-3 min-h-[160px]"
                    style={{
                      // textAlignVertical top para que el cursor empiece arriba
                      textAlignVertical: "top",
                      // Borde de error en rojo si hay validación fallida
                      borderColor: errors.body ? c.error : c.border,
                    }}
                  />
                )}
              />

              {/* Contador de caracteres + mensaje de error */}
              <View className="flex-row justify-between mt-1">
                {errors.body ? (
                  <Text className="text-xs font-body text-error">
                    {errors.body.message}
                  </Text>
                ) : (
                  <View />
                )}
                <Text className="text-xs font-body text-t3">
                  {charCount} caracteres
                </Text>
              </View>
            </View>

            {/* ── Toggle spoilers ──────────────────────────── */}
            <Controller
              control={control}
              name="containsSpoilers"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row justify-between items-center mb-6 py-3 px-4 rounded-card bg-sr border border-border">
                  <View className="flex-1 mr-3">
                    <Text className="font-body-md text-sm text-text">
                      Contiene spoilers
                    </Text>
                    <Text className="font-body text-xs text-t3 mt-0.5">
                      Avisará a otros lectores antes de mostrar tu reseña
                    </Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    // Colores del toggle adaptados al tema de la app
                    trackColor={{ false: c.sh, true: c.accent }}
                    thumbColor={value ? "#fff" : c.t3}
                  />
                </View>
              )}
            />

            {/* ── Botón publicar ───────────────────────────── */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              // El botón se desactiva mientras se envía o si el form no es válido
              disabled={upsertMutation.isPending || !isValid}
          className="py-3.5 rounded-card items-center bg-accent"
          style={{
            // Opacidad reducida cuando está desactivado para feedback visual
            opacity: upsertMutation.isPending || !isValid ? 0.5 : 1,
          }}
            >
              {upsertMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="font-body-sb text-sm text-white">
                  {isEditing ? "Guardar cambios" : "Publicar reseña"}
                </Text>
              )}
            </Pressable>

            {/* Aviso sobre la política de edición */}
            <Text className="font-body text-xs text-t3 text-center mt-3">
              Puedes editar o eliminar tu reseña en cualquier momento.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
