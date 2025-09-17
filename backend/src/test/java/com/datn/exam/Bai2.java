package com.datn.exam;

import java.util.HashSet;
import java.util.Scanner;
import java.util.Set;

public class Bai2 {
    public static void main(String[] args) {
        // 2, 3, 1, 2, 4, 3, 0
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int[] a = new int[n];

        for(int i = 0; i < n; i++) {
            a[i] = sc.nextInt();
        }


    }

    public int minimumLength(int[] a, int n, int target) {
        Set<Integer> set = new HashSet<>();
        int l = 0, total = 0, length = 0;

        for(int r = 0; r < n; r++) {
            total += a[r];

            while(total >= target) {
                l = Math.min(r - l + 1, length);
                total -= a[l];
                l++;
            }
        }

        return length;
    }
}
