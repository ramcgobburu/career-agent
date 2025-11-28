"""
Example usage of the Career Agent
Run this file to see various use cases
"""

import os
from pathlib import Path
from career_agent import CareerAgent
from dotenv import load_dotenv

load_dotenv()


def main():
    # Update this path to your actual career context file
    career_context_path = os.path.expanduser(
        "~/Desktop/Resumes/Career Buddy Resumes/ram_career_context.md"
    )
    
    print("🚀 Initializing Career Agent...")
    print("-" * 60)
    
    try:
        agent = CareerAgent(
            career_context_path=career_context_path,
            model_name=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.7
        )
        print("✅ Agent initialized successfully!\n")
    except Exception as e:
        print(f"❌ Error initializing agent: {e}")
        return
    
    # Example 1: Generate cover letter
    print("=" * 60)
    print("EXAMPLE 1: Cover Letter for ServiceNow")
    print("=" * 60)
    try:
        cover_letter = agent.generate_cover_letter(
            company_name="ServiceNow",
            role_title="Senior Product Manager - AI Platform",
            job_description="Seeking PM with ServiceNow experience, AI/ML background, and enterprise platform expertise",
            tone="professional",
            length="medium"
        )
        print(cover_letter["content"])
        print("\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Example 2: LinkedIn introduction blurb
    print("=" * 60)
    print("EXAMPLE 2: LinkedIn Introduction Blurb")
    print("=" * 60)
    try:
        blurb = agent.generate_blurb(
            purpose="LinkedIn introduction post announcing job search",
            target_role="Engineering Manager",
            max_words=200,
            style="linkedin"
        )
        print(blurb["content"])
        print("\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Example 3: Role-specific summary
    print("=" * 60)
    print("EXAMPLE 3: Product Manager Summary")
    print("=" * 60)
    try:
        summary = agent.generate_role_specific_summary(
            role_type="Product Manager",
            focus_areas=["AI/ML", "Cloud Platforms", "Mobile Applications"]
        )
        print(summary["content"])
        print("\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Example 4: STAR story retrieval
    print("=" * 60)
    print("EXAMPLE 4: STAR Story - Mobile Platform Consolidation")
    print("=" * 60)
    try:
        star = agent.generate_star_story(
            project_name="Consolidated Mobile Platform"
        )
        print(star["content"])
        print("\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Example 5: Interview question answer
    print("=" * 60)
    print("EXAMPLE 5: Interview Question Answer")
    print("=" * 60)
    try:
        answer = agent.answer_interview_question(
            question="Tell me about a time you led a successful platform migration",
            company_context="Tech company focused on cloud-native solutions"
        )
        print(answer["content"])
        print("\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Example 6: Custom query
    print("=" * 60)
    print("EXAMPLE 6: Custom Query")
    print("=" * 60)
    try:
        response = agent.query(
            "What are Ram's key achievements at ACE Hardware with specific metrics?"
        )
        print(response["content"])
        print("\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    print("=" * 60)
    print("✨ Examples complete! You can now use the agent in your own scripts.")
    print("=" * 60)


if __name__ == "__main__":
    main()

















