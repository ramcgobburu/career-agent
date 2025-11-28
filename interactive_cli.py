"""
Interactive CLI for Career Agent
Run this for an interactive session to generate career materials
"""

import os
from pathlib import Path
from career_agent import CareerAgent
from dotenv import load_dotenv

load_dotenv()


def print_header(text):
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")


def print_menu():
    print_header("Career Agent - Main Menu")
    print("1. Generate Cover Letter")
    print("2. Generate LinkedIn/Email Blurb")
    print("3. Generate Role-Specific Summary")
    print("4. Get STAR Story")
    print("5. Answer Interview Question")
    print("6. Custom Query")
    print("7. Exit")
    print("\n")


def generate_cover_letter_interactive(agent):
    print_header("Cover Letter Generator")
    
    company = input("Company name: ").strip()
    if not company:
        print("❌ Company name required")
        return
    
    role = input("Role title: ").strip()
    if not role:
        print("❌ Role title required")
        return
    
    print("\nOptional: Paste job description (press Enter twice when done):")
    job_desc_lines = []
    while True:
        line = input()
        if not line:
            break
        job_desc_lines.append(line)
    job_description = "\n".join(job_desc_lines) if job_desc_lines else None
    
    tone = input("Tone (professional/friendly/formal) [professional]: ").strip() or "professional"
    length = input("Length (short/medium/long) [medium]: ").strip() or "medium"
    
    print("\n⏳ Generating cover letter...")
    try:
        result = agent.generate_cover_letter(
            company_name=company,
            role_title=role,
            job_description=job_description,
            tone=tone,
            length=length
        )
        print("\n" + "=" * 70)
        print(result["content"])
        print("=" * 70)
    except Exception as e:
        print(f"❌ Error: {e}")


def generate_blurb_interactive(agent):
    print_header("Blurb Generator")
    
    purpose = input("Purpose (e.g., 'LinkedIn introduction'): ").strip()
    if not purpose:
        print("❌ Purpose required")
        return
    
    target_role = input("Target role (optional): ").strip() or None
    max_words = input("Max words [200]: ").strip()
    max_words = int(max_words) if max_words.isdigit() else 200
    
    style = input("Style (linkedin/email/professional) [linkedin]: ").strip() or "linkedin"
    
    print("\n⏳ Generating blurb...")
    try:
        result = agent.generate_blurb(
            purpose=purpose,
            target_role=target_role,
            max_words=max_words,
            style=style
        )
        print("\n" + "=" * 70)
        print(result["content"])
        print("=" * 70)
    except Exception as e:
        print(f"❌ Error: {e}")


def generate_summary_interactive(agent):
    print_header("Role-Specific Summary")
    
    role_type = input("Role type (e.g., 'Product Manager', 'Engineering Manager'): ").strip()
    if not role_type:
        print("❌ Role type required")
        return
    
    print("\nFocus areas (comma-separated, or press Enter for none):")
    focus_input = input().strip()
    focus_areas = [f.strip() for f in focus_input.split(",") if f.strip()] if focus_input else None
    
    print("\n⏳ Generating summary...")
    try:
        result = agent.generate_role_specific_summary(
            role_type=role_type,
            focus_areas=focus_areas
        )
        print("\n" + "=" * 70)
        print(result["content"])
        print("=" * 70)
    except Exception as e:
        print(f"❌ Error: {e}")


def get_star_story_interactive(agent):
    print_header("STAR Story")
    
    print("Choose an option:")
    print("1. Retrieve existing STAR story by project name")
    print("2. Create new STAR story from situation")
    choice = input("Choice [1]: ").strip() or "1"
    
    if choice == "1":
        project_name = input("Project name (e.g., 'Manhattan WMOS Migration'): ").strip()
        if not project_name:
            print("❌ Project name required")
            return
        print("\n⏳ Retrieving STAR story...")
        try:
            result = agent.generate_star_story(project_name=project_name)
            print("\n" + "=" * 70)
            print(result["content"])
            print("=" * 70)
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("\nDescribe the situation:")
        situation = input().strip()
        if not situation:
            print("❌ Situation description required")
            return
        print("\n⏳ Creating STAR story...")
        try:
            result = agent.generate_star_story(situation_description=situation)
            print("\n" + "=" * 70)
            print(result["content"])
            print("=" * 70)
        except Exception as e:
            print(f"❌ Error: {e}")


def answer_interview_question_interactive(agent):
    print_header("Interview Question Answer")
    
    question = input("Interview question: ").strip()
    if not question:
        print("❌ Question required")
        return
    
    company_context = input("Company context (optional): ").strip() or None
    
    print("\n⏳ Generating answer...")
    try:
        result = agent.answer_interview_question(
            question=question,
            company_context=company_context
        )
        print("\n" + "=" * 70)
        print(result["content"])
        print("=" * 70)
    except Exception as e:
        print(f"❌ Error: {e}")


def custom_query_interactive(agent):
    print_header("Custom Query")
    
    question = input("Your question: ").strip()
    if not question:
        print("❌ Question required")
        return
    
    print("\n⏳ Processing query...")
    try:
        result = agent.query(question)
        print("\n" + "=" * 70)
        print(result["content"])
        print("=" * 70)
    except Exception as e:
        print(f"❌ Error: {e}")


def main():
    # Career context path
    career_context_path = os.path.expanduser(
        "~/Desktop/Resumes/Career Buddy Resumes/ram_career_context.md"
    )
    
    print_header("Career Agent - Initializing")
    print("Loading career context and initializing AI agent...")
    
    try:
        agent = CareerAgent(
            career_context_path=career_context_path,
            model_name=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.7
        )
        print("✅ Agent ready!")
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        print(f"\nPlease update the career_context_path in interactive_cli.py")
        return
    except Exception as e:
        print(f"❌ Error initializing agent: {e}")
        return
    
    # Main loop
    while True:
        print_menu()
        choice = input("Select an option (1-7): ").strip()
        
        if choice == "1":
            generate_cover_letter_interactive(agent)
        elif choice == "2":
            generate_blurb_interactive(agent)
        elif choice == "3":
            generate_summary_interactive(agent)
        elif choice == "4":
            get_star_story_interactive(agent)
        elif choice == "5":
            answer_interview_question_interactive(agent)
        elif choice == "6":
            custom_query_interactive(agent)
        elif choice == "7":
            print("\n👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please select 1-7.")
        
        input("\nPress Enter to continue...")


if __name__ == "__main__":
    main()


















