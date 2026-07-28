import axe from "axe-core";

window.setTimeout(() => {
  void axe.run(document).then((results) => {
    console.info(
      "[axe-audit]",
      JSON.stringify(
        results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          nodes: violation.nodes.map((node) => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
          })),
        })),
      ),
    );
  });
}, 3_000);
