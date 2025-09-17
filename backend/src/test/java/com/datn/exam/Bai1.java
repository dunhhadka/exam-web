package com.datn.exam;

import java.util.*;

// Cho string dài. tìm kiếm độ dài dài nhất mà không lặp trong string đó
public class Bai1 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        String s = sc.nextLine();



    }

    public int lengthOfLongestSubstring(String s) {
        Set<Character> set = new HashSet<>();
        int l = 0, r = 0, max = 0;

        for(r = 0; r < s.length(); r++) {
            char c = s.charAt(r);

            while(set.contains(c)) {
                set.remove(s.charAt(l));
                l++;
            }
            set.add(c);
            max = Math.max(max, r - l + 1);
        }

        return max;
    }

    public int lengthOfLongestSubstringMap(String s) {
        Map<Character, Integer> map = new HashMap<>();
        int l = 0, max = 0;

        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);

            if (map.containsKey(c)) {
                l = Math.max(l, map.get(c));
            }

            map.put(c, r);
            max = Math.max(max, r - l + 1);
        }

        return max;
    }
}
