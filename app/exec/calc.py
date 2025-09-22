#!/usr/bin/env python3
# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import sys
import math

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Please provide a number as an argument.")
        sys.exit(1)

    try:
        num = int(sys.argv[1])
        
        # Basic operations
        print(f"- [[square]]: **{num * num}**")
        if num >= 0:
            print(f"- [[square root]]: **{math.sqrt(num):.4f}**")
        print(f"- [[cube]]: **{num ** 3}**")
        if num >= 0:
            print(f"- [[cube root]]: **{num**(1/3):.4f}**")
        
        # Logarithms
        if num > 0:
            print(f"- [[natural log]] (ln): **{math.log(num):.4f}**")
            print(f"- [[base-10 log]] (log10): **{math.log10(num):.4f}**")
            print(f"- [[base-2 log]] (log2): **{math.log2(num):.4f}**")

    except ValueError:
        print(f"'{sys.argv[1]}' is not a valid integer.")
        sys.exit(1)