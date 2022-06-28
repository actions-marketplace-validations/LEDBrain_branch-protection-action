const core = require('@actions/core');
const { getOctokit, context } = require('@actions/github');

/**
 * 3 Steps:
 * 1. Get initial branch protection rule for current branch (main mostly)
 * 2. Disable all branch protection rules for current branch
 * 3. After actions completed, restore branch protection rule to initial state
 */

// most @actions toolkit packages have async methods
async function run() {
    const octokit = getOctokit(
        core.getInput('token', {
            required: true,
        })
    );

    try {
        if (!core.getState('STATE_branch-protection-has-run')) {
            const branch = core.getInput('branch', { required: true }),
                owner = context.repo.owner,
                repo = context.repo.repo;
            core.debug(`${branch}, ${owner}, ${repo}`);

            const { data: state } =
                await octokit.rest.repos.getBranchProtection({
                    branch,
                    owner,
                    repo,
                });
            core.debug(state);
            core.saveState('STATE_initial-branch-protection', state);
            await octokit.rest.repos.deleteBranchProtection({
                branch,
                owner,
                repo,
            });
            // await octokit.rest.repos.updateBranchProtection({
            //     branch,
            //     owner,
            //     repo,
            //     restrictions: null,
            //     required_pull_request_reviews: null,
            //     required_signatures: {},
            //     enforce_admins: false,
            //     required_linear_history: false,
            //     allow_force_pushes: true,
            //     allow_deletions: true,
            //     block_creations: false,
            //     required_conversation_resolution: false,
            //     required_status_checks: null,
            // });
            core.saveState('STATE_branch-protection-has-run', true);
        } else {
            const branch = core.getInput('branch', { required: true }),
                owner = context.repo.owner,
                repo = context.repo.repo;
            core.debug(`${branch}, ${owner}, ${repo}`);

            const initState = JSON.parse(
                core.getState('STATE_initial-branch-protection')
            );
            core.debug(initState);
            const updatedState =
                await octokit.rest.repos.updateBranchProtection({
                    branch,
                    owner,
                    repo,

                    restrictions: initState.restrictions
                        ? {
                              users:
                                  initState.restrictions?.users?.map(
                                      (u) => u?.login
                                  ) || [],
                              teams:
                                  initState.restrictions?.teams?.map(
                                      (t) => t?.slug
                                  ) || [],
                              apps:
                                  initState.restrictions?.apps?.map(
                                      (a) => a?.slug
                                  ) || [],
                          }
                        : null,
                    required_pull_request_reviews: {
                        dismissal_restrictions: initState
                            .required_pull_request_reviews
                            ?.dismissal_restrictions
                            ? {
                                  users:
                                      initState.required_pull_request_reviews?.dismissal_restrictions?.users?.map(
                                          (u) => u?.login
                                      ) || [],
                                  teams:
                                      initState.required_pull_request_reviews?.dismissal_restrictions?.teams?.map(
                                          (t) => t?.slug
                                      ) || [],
                              }
                            : null,
                        dismiss_stale_reviews:
                            initState.required_pull_request_reviews
                                ?.dismiss_stale_reviews || false,
                        require_code_owner_reviews:
                            initState.required_pull_request_reviews
                                ?.require_code_owner_reviews || false,
                        required_approving_review_count:
                            initState.required_pull_request_reviews
                                ?.required_approving_review_count || 0,
                        bypass_pull_request_allowances: initState
                            .required_pull_request_reviews
                            ?.bypass_pull_request_allowances
                            ? {
                                  users:
                                      initState.required_pull_request_reviews?.bypass_pull_request_allowances?.users?.map(
                                          (u) => u?.login
                                      ) || [],
                                  teams:
                                      initState.required_pull_request_reviews?.bypass_pull_request_allowances?.teams?.map(
                                          (t) => t?.slug
                                      ) || [],
                                  apps:
                                      initState.required_pull_request_reviews?.bypass_pull_request_allowances?.apps?.map(
                                          (a) => a?.slug
                                      ) || [],
                              }
                            : null,
                    },

                    required_signatures:
                        initState.required_signatures?.enabled || null,

                    enforce_admins: initState.enforce_admins?.enabled || null,

                    required_linear_history:
                        initState.required_linear_history?.enabled || false,

                    allow_force_pushes:
                        initState.allow_force_pushes?.enabled || false,

                    allow_deletions:
                        initState.allow_deletions?.enabled || false,

                    block_creations:
                        initState.block_creations?.enabled || false,

                    required_conversation_resolution:
                        initState.required_conversation_resolution?.enabled ||
                        false,

                    required_status_checks: {
                        strict:
                            initState.required_status_checks?.strict || false,
                        // contexts:
                        //     initState.required_status_checks?.contexts || [],
                        checks:
                            initState.required_status_checks?.checks?.map(
                                (c) => ({
                                    context: c?.context,
                                    app_id: c?.app_id,
                                })
                            ) || undefined,
                    },
                });
            core.debug(`Status: ${updatedState.status}`);
            core.debug(updatedState.data);
        }
    } catch (error) {
        if (error.code === 404 && error.message === 'Branch not protected') {
            core.notice('Branch not protected');
            core.saveState('STATE_branch-protection-has-run', null);
        } else {
            core.setFailed(error.message);
        }
    }
}

run();
