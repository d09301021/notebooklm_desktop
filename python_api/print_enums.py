
from notebooklm.rpc.types import QuizDifficulty, QuizQuantity

print("QuizDifficulty:")
for item in QuizDifficulty:
    print(f"  {item.name} = {item.value}")

print("\nQuizQuantity:")
for item in QuizQuantity:
    print(f"  {item.name} = {item.value}")
