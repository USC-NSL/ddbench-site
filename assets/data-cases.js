// Tier 1 per-case paired outcomes (10 models x 31 cases).
// Cells are read from Figure 18 of the NeurIPS 2026 paper and validated against its printed
// per-model W/L counts, Table 1, Table 2 and the 72/13/83/142 totals. Case folders and
// descriptions come from registry/case_registry.json in the DDBench repo.
// G = FAIL->PASS, R = PASS->FAIL, B = PASS->PASS, N = FAIL->FAIL
window.DDBENCH_CASES = {
 "caseOrder": [
  {
   "short": "zookeeper-4846",
   "folder": "zookeeper-4846-fuzzy-snapshot-acl",
   "group": "Concurrency hazards",
   "desc": "Fuzzy snapshot ACL cache race causes fatal RuntimeException on restart",
   "upstream": "https://issues.apache.org/jira/browse/ZOOKEEPER-4846"
  },
  {
   "short": "raft-268",
   "folder": "raft-268-shutdown-deadlock",
   "group": "Concurrency hazards",
   "desc": "Raft.Shutdown() deadlocks with concurrent takeSnapshot()",
   "upstream": "https://github.com/hashicorp/raft/issues/268"
  },
  {
   "short": "bookkeeper-4701",
   "folder": "bookkeeper-4701-fencing-race",
   "group": "Concurrency hazards",
   "desc": "Fencing bypassed due to race in HandleFactory causing entry loss",
   "upstream": "https://github.com/apache/bookkeeper/pull/4701"
  },
  {
   "short": "ra-439",
   "folder": "ra-439-election-livelock",
   "group": "Concurrency hazards",
   "desc": "Election livelock when candidate has lower log index than pre-vote member",
   "upstream": "https://github.com/rabbitmq/ra/issues/439"
  },
  {
   "short": "zookeeper-4925",
   "folder": "zookeeper-4925-diff-sync-committedlog-hole",
   "group": "Replication & consistency",
   "desc": "Stale follower propagates committedLog hole after DIFF sync becoming leader",
   "upstream": "https://issues.apache.org/jira/browse/ZOOKEEPER-4925"
  },
  {
   "short": "etcd-20221",
   "folder": "etcd-20221-watch-restore-revision",
   "group": "Replication & consistency",
   "desc": "Watch on future revision receives old events after snapshot restore",
   "upstream": "https://github.com/etcd-io/etcd/issues/20221"
  },
  {
   "short": "kafka-15784",
   "folder": "kafka-15784-txn-offset-atomicity",
   "group": "Replication & consistency",
   "desc": "Transactional offset commit racing group deletion or offsets-partition reload diverges from the log",
   "upstream": "https://issues.apache.org/jira/browse/KAFKA-15784"
  },
  {
   "short": "etcd-19179",
   "folder": "etcd-19179-watch-tombstone-compact",
   "group": "Replication & consistency",
   "desc": "Missing delete event on watch after compaction removes all put revisions",
   "upstream": "https://github.com/etcd-io/etcd/issues/19179"
  },
  {
   "short": "kvrocks-2214",
   "folder": "kvrocks-2214-slave-sync-gap",
   "group": "Replication & consistency",
   "desc": "Slave misses key updates during downtime due to replication offset drift",
   "upstream": "https://github.com/apache/kvrocks/issues/2214"
  },
  {
   "short": "etcd-17158",
   "folder": "etcd-17158-delete-linearizability",
   "group": "Replication & consistency",
   "desc": "UnsafeDelete breaks linearizability due to buffered read seeing stale data",
   "upstream": "https://github.com/etcd-io/etcd/issues/17158"
  },
  {
   "short": "nats-7817",
   "folder": "nats-7817-workqueue-message-loss",
   "group": "Replication & consistency",
   "desc": "Messages lost with JetStream WorkQueue retention and R3 on max-deliver",
   "upstream": "https://github.com/nats-io/nats-server/issues/7817"
  },
  {
   "short": "raft-460",
   "folder": "raft-460-logcache-store-order",
   "group": "Replication & consistency",
   "desc": "LogCache caches entries before StoreLogs causing phantom data on restart",
   "upstream": "https://github.com/hashicorp/raft/issues/429"
  },
  {
   "short": "etcd-17529",
   "folder": "etcd-17529-watch-compaction-loss",
   "group": "Replication & consistency",
   "desc": "Watch event loss after compaction when watcher channel is full",
   "upstream": "https://github.com/etcd-io/etcd/issues/17529"
  },
  {
   "short": "nats-7308",
   "folder": "nats-7308-delete-nonexistent-reset",
   "group": "Protocol & recovery",
   "desc": "Deleting non-existent message triggers cluster state reset and stream unavailability",
   "upstream": "https://github.com/nats-io/nats-server/issues/7308"
  },
  {
   "short": "raft-581",
   "folder": "raft-581-transfer-write-race",
   "group": "Protocol & recovery",
   "desc": "Leadership transfer fails when writes advance log during transfer window",
   "upstream": "https://github.com/hashicorp/raft/pull/581"
  },
  {
   "short": "nats-6374",
   "folder": "nats-6374-consumer-stuck-redelivery",
   "group": "Protocol & recovery",
   "desc": "Consumer stuck and slow after leader step-down with pending redeliveries",
   "upstream": "https://github.com/nats-io/nats-server/issues/6374"
  },
  {
   "short": "consul-8377",
   "folder": "consul-8377-snapshot-restore-index",
   "group": "Protocol & recovery",
   "desc": "Snapshot restore loses node/service/check CreateIndex across replicas",
   "upstream": "https://github.com/hashicorp/consul/issues/8377"
  },
  {
   "short": "rabbitmq-12635",
   "folder": "rabbitmq-12635-qq-snapshot-crash",
   "group": "Protocol & recovery",
   "desc": "Quorum queue member crashes after Raft snapshot installation (stale log read)",
   "upstream": "https://github.com/rabbitmq/rabbitmq-server/issues/12635"
  },
  {
   "short": "raft-609",
   "folder": "raft-609-prevote-contact-liveness",
   "group": "Protocol & recovery",
   "desc": "Pre-vote refreshes last-contact timestamp blocking new elections",
   "upstream": "https://github.com/hashicorp/raft/pull/609"
  },
  {
   "short": "etcd-20893",
   "folder": "etcd-20893-force-new-cluster-learner",
   "group": "Protocol & recovery",
   "desc": "--force-new-cluster fails to remove learner members after snapshot",
   "upstream": "https://github.com/etcd-io/etcd/issues/20893"
  },
  {
   "short": "kvrocks-2520",
   "folder": "kvrocks-2520-namespace-fullsync",
   "group": "Protocol & recovery",
   "desc": "Namespaces not loaded into memory after full sync from master",
   "upstream": "https://github.com/apache/kvrocks/issues/2520"
  },
  {
   "short": "bookkeeper-2614",
   "folder": "bookkeeper-2614-recovery-fencing-gap",
   "group": "Protocol & recovery",
   "desc": "Recovery reads missing fencing flag allow original writer to commit after ledger close",
   "upstream": "https://github.com/apache/bookkeeper/pull/2616"
  },
  {
   "short": "consul-9772",
   "folder": "consul-9772-streaming-snapshot-cache",
   "group": "Protocol & recovery",
   "desc": "Streaming event publisher caches framing event in snapshot corrupting fresh subscribers",
   "upstream": "https://github.com/hashicorp/consul/pull/9772"
  },
  {
   "short": "kafka-15170",
   "folder": "kafka-15170-endless-rebalance-loop",
   "group": "Protocol & recovery",
   "desc": "CooperativeStickyAssignor endless rebalance loop with rack-aware balancing",
   "upstream": "https://issues.apache.org/jira/browse/KAFKA-15170"
  },
  {
   "short": "nats-7760",
   "folder": "nats-7760-filter-stepdown",
   "group": "Protocol & recovery",
   "desc": "Consumer filter subjects stop matching after leader step-down",
   "upstream": "https://github.com/nats-io/nats-server/issues/7760"
  },
  {
   "short": "zookeeper-4643",
   "folder": "zookeeper-4643-sync-epoch-ordering",
   "group": "Protocol & recovery",
   "desc": "Follower persists uncommitted proposals before updating epoch during ZAB sync",
   "upstream": "https://issues.apache.org/jira/browse/ZOOKEEPER-4643"
  },
  {
   "short": "nats-7718",
   "folder": "nats-7718-subscription-leak",
   "group": "Resource & delivery",
   "desc": "JetStream leaks subscriptions with overlapping stream imports and OrderedConsumer churn",
   "upstream": "https://github.com/nats-io/nats-server/issues/7718"
  },
  {
   "short": "dragonfly-6687",
   "folder": "dragonfly-6687-replica-rdb-encoding",
   "group": "Resource & delivery",
   "desc": "Replica sync fails with unknown RDB encoding 62 and retries in loop",
   "upstream": "https://github.com/dragonflydb/dragonfly/issues/6687"
  },
  {
   "short": "kafka-14334",
   "folder": "kafka-14334-delayed-fetch-purgatory",
   "group": "Resource & delivery",
   "desc": "Delayed fetch purgatory not completed on follower replica append",
   "upstream": "https://issues.apache.org/jira/browse/KAFKA-14334"
  },
  {
   "short": "kvrocks-3208",
   "folder": "kvrocks-3208-replication-watermark",
   "group": "Resource & delivery",
   "desc": "Replication stalls after large batch due to stuck read watermark",
   "upstream": "https://github.com/apache/kvrocks/issues/3208"
  },
  {
   "short": "kvrocks-3356",
   "folder": "kvrocks-3356-replication-wal",
   "group": "Resource & delivery",
   "desc": "Replication feed thread blocks on slow consumer causing WAL exhaustion",
   "upstream": "https://github.com/apache/kvrocks/issues/3356"
  }
 ],
 "rows": [
  {
   "model": "opus46",
   "cells": "GBBNBBGBGNNBBBBGBBBBNNBNNNGNNBR"
  },
  {
   "model": "mini54",
   "cells": "GBBGBBRRGBNBBGGNGNBBNNBNNNGNNBB"
  },
  {
   "model": "sonnet46",
   "cells": "BBBNGBNGBGNBBGBGNNBBNNBNNNBNNBN"
  },
  {
   "model": "gpt54",
   "cells": "GBBGGBGBNBRBBGGNBNBBGNBNNNGNGBN"
  },
  {
   "model": "glm51",
   "cells": "GGBNGBNBNNNBBBGNNNBBNNBNNNGNNBN"
  },
  {
   "model": "kimik25",
   "cells": "GGGRGBNNNNNBNNNGGNBGRNBNNRRNNRB"
  },
  {
   "model": "glm5",
   "cells": "GGGGBGNGNNNBNBBNNNBBNNRNNNGNNBR"
  },
  {
   "model": "gemma4",
   "cells": "GNBNGGGNNNNBNBNNNNBBNNNNNNGGNBN"
  },
  {
   "model": "glm47",
   "cells": "GGGNGGGGNNNGRGGNNGGBNNNNNNGNNNB"
  },
  {
   "model": "gptoss",
   "cells": "GNNNGGNNNNGBNNNNNGGRNNNNNNGNNGN"
  }
 ]
};
