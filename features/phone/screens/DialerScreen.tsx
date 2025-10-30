import { Text } from "@/components/ui/Text";
import { MaterialIcons } from "@expo/vector-icons";
import { AnimatePresence, MotiView } from "moti";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import DialPad from "../components/DialPad";

type Lead = { id: string; name: string; phone: string; code?: string };

const SAMPLE_LEADS: Lead[] = [
  { id: "1", name: "Aarav Patel", phone: "+91 99988 11223", code: "AP-001" },
  { id: "2", name: "Neha Sharma", phone: "+91 98765 43210", code: "NS-014" },
  { id: "3", name: "Rohan Mehta", phone: "+91 88990 11122", code: "RM-221" },
  { id: "4", name: "Sara Khan", phone: "+91 77889 66770", code: "SK-087" },
];

const T9: Record<string, string> = {
  a: "2", b: "2", c: "2",
  d: "3", e: "3", f: "3",
  g: "4", h: "4", i: "4",
  j: "5", k: "5", l: "5",
  m: "6", n: "6", o: "6",
  p: "7", q: "7", r: "7", s: "7",
  t: "8", u: "8", v: "8",
  w: "9", x: "9", y: "9", z: "9",
};

const normalize = (s: string) => s.replace(/\s|\-|\(|\)/g, "");
const toT9 = (s: string) => s.toLowerCase().split("").map((ch) => T9[ch] ?? ch).join("");

export default function DialerScreen() {
  const [query, setQuery] = useState("");
  const [dial, setDial] = useState("");
  const [open, setOpen] = useState(false);
  const [calling, setCalling] = useState<null | string>(null);
  const callTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return SAMPLE_LEADS;
    const qDigits = q.replace(/\D/g, "");
    return SAMPLE_LEADS.filter((l) => {
      const name = l.name.toLowerCase();
      const phone = normalize(l.phone);
      const code = l.code?.toLowerCase() ?? "";
      const nameT9 = toT9(name);
      return (
        name.includes(q.toLowerCase()) ||
        code.includes(q.toLowerCase()) ||
        phone.includes(qDigits) ||
        (!!qDigits && nameT9.includes(qDigits))
      );
    });
  }, [query]);

  const endCall = () => {
    if (callTimerRef.current) {
      clearTimeout(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCalling(null);
  };

  const startCall = (number: string) => {
    const n = normalize(number || dial);
    if (!n) return;
    setCalling(n);
    if (callTimerRef.current) {
      clearTimeout(callTimerRef.current);
    }
    callTimerRef.current = setTimeout(() => {
      setCalling(null);
      callTimerRef.current = null;
    }, 1000 * 45);
  };

  useEffect(() => {
    return () => {
      if (callTimerRef.current) {
        clearTimeout(callTimerRef.current);
      }
    };
  }, []);

  return (
    <View className="flex-1 bg-white dark:bg-[#0C111D]">
      {/* Search */}
      <View className="px-4 pt-6 pb-3">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, code, or number"
          placeholderTextColor="#9BA1A6"
          className="h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-black/20"
        />
      </View>

      {/* Leads list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View className="h-px bg-gray-200 dark:bg-gray-800" />}
        renderItem={({ item }) => (
          <View className="px-4 py-3 flex-row items-center justify-between">
            <View>
              <Text weight="semibold" className="text-gray-900 dark:text-gray-100">{item.name}</Text>
              <Text size="sm" className="text-gray-500 dark:text-gray-400">{item.phone}{item.code ? '  •  ' + item.code : ''}</Text>
            </View>
            <Pressable onPress={() => startCall(item.phone)} className="px-3 py-1.5 rounded-lg bg-emerald-600">
              <Text weight="bold" className="text-white">Call</Text>
            </Pressable>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Floating dial FAB */}
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute right-5 bottom-8 h-14 w-14 rounded-full items-center justify-center bg-indigo-600 shadow-lg"
        accessibilityLabel="Open dial pad"
      >
        <MaterialIcons name="dialpad" color="#fff" size={26} />
      </Pressable>

      {/* Dial pad overlay */}
      <DialPad
        visible={open}
        value={dial}
        onChange={setDial}
        onClose={() => setOpen(false)}
        onCall={(n) => {
          setOpen(false);
          startCall(n);
        }}
      />

      {/* Fake call in progress indicator */}
      <AnimatePresence>
        {calling && (
          <MotiView
            key="calling"
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 bottom-0 pb-8 items-center"
          >
            <MotiView
              from={{ opacity: 0.6, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1.05 }}
              exit={{ opacity: 0 }}
              transition={{ type: "timing", duration: 800, loop: true }}
              className="h-12 px-4 rounded-full bg-emerald-600 items-center justify-center"
            >
              <Text weight="bold" className="text-white">Calling {calling}...</Text>
            </MotiView>
            <Pressable onPress={endCall} className="mt-2 px-3 py-1.5 rounded-lg bg-gray-800/70">
              <Text className="text-white">End</Text>
            </Pressable>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}

