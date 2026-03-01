#!/usr/bin/env -S uv run
# /// script
# dependencies = ["python-dotenv", "pydantic"]
# ///

"""
Generate E2E tests for coverage gaps.
Usage: uv run pw_generate_tests.py
"""

import sys
import os
from dotenv import load_dotenv
from adw_modules.agent import execute_template
from adw_modules.data_types import AgentTemplateRequest
from adw_modules.utils import make_adw_id, setup_logger, parse_json

load_dotenv()

def main():
    adw_id = make_adw_id()
    logger = setup_logger(adw_id, "pw_generate_tests")
    
    # Step 1: Find coverage gaps
    logger.info("Analyzing coverage gaps...")
    gap_request = AgentTemplateRequest(
        agent_name="pw_coverage_analyzer",
        slash_command="/pw_coverage_gap",
        args=[],
        adw_id=adw_id,
        model="sonnet",
    )
    gap_response = execute_template(gap_request)
    
    if not gap_response.success:
        logger.error(f"Coverage analysis failed: {gap_response.output}")
        sys.exit(1)
    
    gaps = parse_json(gap_response.output, list)
    high_priority = [g for g in gaps if g.get("priority") == "high" 
                     and g.get("coverage_status") == "missing"]
    
    logger.info(f"Found {len(high_priority)} high priority gaps")
    
    # Step 2: Generate tests for each gap
    for gap in high_priority:
        logger.info(f"Generating test for: {gap['feature']}")
        gen_request = AgentTemplateRequest(
            agent_name=f"pw_test_generator_{gap['feature']}",
            slash_command="/pw_generate_e2e_test",
            args=[gap["description"], gap["suggested_test_file"]],
            adw_id=adw_id,
            model="opus",
        )
        gen_response = execute_template(gen_request)
        
        if gen_response.success:
            logger.info(f"✅ Generated: {gap['suggested_test_file']}")
        else:
            logger.error(f"❌ Failed to generate: {gap['feature']}")

if __name__ == "__main__":
    main()