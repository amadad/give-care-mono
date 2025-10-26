#!/usr/bin/env python3
"""
Fix wellness-ownership.test.ts to use correct convex-test API.
Transform: t.query(api..., {args}, {identity: {subject: userId}})
To: t.withIdentity({subject: userId}).query(api..., {args})
"""

import re

def fix_test_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Pattern 1: await expect(t.query(...), {...}, {identity: {subject: ...}}).rejects
    # Replace with withIdentity
    pattern1 = r't\.query\((api\.[\w.]+),\s*({[^}]+}),\s*{\s*identity:\s*{\s*subject:\s*(\w+)\s*}\s*}\)'

    def replacement1(match):
        api_call = match.group(1)
        args = match.group(2)
        identity_var = match.group(3)
        return f't.withIdentity({{ subject: {identity_var} }}).query({api_call}, {args})'

    content = re.sub(pattern1, replacement1, content)

    # Pattern 2: const result = await t.query(...), {...}, {identity: {subject: ...}})
    # Already handled by pattern 1

    # Remove unused USER_A_CLERK_ID and USER_B_CLERK_ID constants
    content = re.sub(r'\s*const USER_A_CLERK_ID = [^\n]+\n', '', content)
    content = re.sub(r'\s*const USER_B_CLERK_ID = [^\n]+\n', '', content)

    with open(filepath, 'w') as f:
        f.write(content)

    print(f"Fixed {filepath}")

if __name__ == '__main__':
    fix_test_file('/Users/amadad/Projects/givecare/give-care-app/tests/wellness-ownership.test.ts')
