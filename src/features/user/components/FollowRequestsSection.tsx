import { useRouter } from 'expo-router';
import { Check, UserCheck, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Avatar } from '~/components/ui/Avatar';
import { useRespondToFollow } from '../hooks/useRespondToFollow';
import type { PendingRequest } from '../user.queries';

interface RequestRowProps {
  request: PendingRequest;
}

function RequestRow({ request }: RequestRowProps) {
  const router = useRouter();
  const { accept, reject } = useRespondToFollow();
  const isPending = accept.isPending || reject.isPending;

  return (
    <View className="flex-row items-center gap-3 py-3 px-4">
      <Pressable
        onPress={() =>
          router.push(`/user/${request.requester.username}` as any)
        }
      >
        <Avatar
          displayName={request.requester.display_name}
          username={request.requester.username}
          avatarUrl={request.requester.avatar_url}
          size={44}
        />
      </Pressable>

      <Pressable
        onPress={() => router.push(`/user/${request.requester.username}` as any)}
        className="flex-1 min-w-0"
      >
        <Text className="text-xs font-body-sb text-text" numberOfLines={1}>
          {request.requester.display_name}
        </Text>
        <Text className="text-xs font-body text-t3 mt-0.5" numberOfLines={1}>
          @{request.requester.username}
        </Text>
        {request.requester.bio ? (
          <Text className="text-xs font-body text-t2 mt-0.5" numberOfLines={1}>
            {request.requester.bio}
          </Text>
        ) : null}
      </Pressable>

      <View className="flex-row gap-2 shrink-0">
        {isPending ? (
          <ActivityIndicator size="small" className="text-accent" />
        ) : (
          <>
            <Pressable
              onPress={() => accept.mutate(request.follow_id)}
              className="w-9 h-9 rounded-full bg-accent items-center justify-center"
            >
              <Check size={16} color="#fff" strokeWidth={2.2} />
            </Pressable>
            <Pressable
              onPress={() => reject.mutate(request.follow_id)}
              className="w-9 h-9 rounded-full bg-sh border border-border items-center justify-center"
            >
              <X size={16} className="text-t2" strokeWidth={2.2} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

interface Props {
  requests: PendingRequest[];
}

export function FollowRequestsSection({ requests }: Props) {
  if (requests.length === 0) return null;

  return (
    <View className="border-b border-border mb-1">
      {/* Header */}
      <View className="flex-row items-center gap-2 px-4 pt-4 pb-2">
        <View className="w-5 h-5 rounded-full bg-accent items-center justify-center">
          <UserCheck size={12} color="#fff" strokeWidth={2.2} />
        </View>
        <Text className="text-xs font-body-sb text-text">
          Solicitudes de seguimiento
        </Text>
        <View className="ml-auto bg-accent rounded-full px-2 py-0.5">
          <Text className="text-xs font-body-sb text-white">{requests.length}</Text>
        </View>
      </View>

      {requests.map((req) => (
        <RequestRow key={req.follow_id} request={req} />
      ))}
    </View>
  );
}
